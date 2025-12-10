"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

interface Invoice {
  id: string;
  invoiceNumber: string;
  billingMonth: string;
  totalAmount: number;
  totalCoupons: number;
  commissionRate: number;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  dueDate: string;
  paidAt: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: string;
}

interface Summary {
  totalUnpaid: number;
  overdueCount: number;
  paymentOverdue: boolean;
}

interface PaymentInfo {
  type: string;
  merchantNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  reference: string;
  instructions: string;
}

export default function BillingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("bkash");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const authData = await res.json();

        if (!authData.authenticated || authData.user?.type !== "RESTAURANT") {
          router.push("/restaurant/login");
          return;
        }

        fetchInvoices();
      } catch {
        router.push("/restaurant/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/restaurant/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Fetch invoices error:", error);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
    setPaymentInfo(null);
    setTransactionId("");

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          paymentMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentInfo(data.paymentInfo);
      }
    } catch (error) {
      console.error("Initiate payment error:", error);
    }
  };

  const confirmPayment = async () => {
    if (!selectedInvoice || !transactionId.trim()) return;

    setConfirming(true);
    try {
      const res = await fetch("/api/payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          transactionId: transactionId.trim(),
          paymentMethod,
        }),
      });

      if (res.ok) {
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        setPaymentInfo(null);
        setTransactionId("");
        fetchInvoices();
      }
    } catch (error) {
      console.error("Confirm payment error:", error);
    } finally {
      setConfirming(false);
    }
  };

  const formatMonth = (month: string): string => {
    const [year, m] = month.split("-");
    const monthNames = language === "bn" 
      ? ["জানু", "ফেব", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্ট", "অক্টো", "নভে", "ডিসে"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[parseInt(m) - 1]} ${year}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700",
      SENT: "bg-blue-100 text-blue-700",
      PAID: "bg-green-100 text-green-700",
      OVERDUE: "bg-red-100 text-red-700",
      CANCELLED: "bg-gray-100 text-gray-500",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, Record<string, string>> = {
      DRAFT: { en: "Draft", bn: "ড্রাফট" },
      SENT: { en: "Pending", bn: "পেন্ডিং" },
      PAID: { en: "Paid", bn: "পেইড" },
      OVERDUE: { en: "Overdue", bn: "ওভারডিউ" },
      CANCELLED: { en: "Cancelled", bn: "বাতিল" },
    };
    return texts[status]?.[language] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #7DD3C0 0%, #A8E6CF 50%, #E8F5E9 100%)" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-medium">
            {language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "linear-gradient(180deg, #7DD3C0 0%, #A8E6CF 30%, #F5F5F5 60%)" }}>
      {/* Header */}
      <div className="pt-6 pb-4 px-4">
        <h1 className="text-xl font-bold text-gray-800">
          {t("billing", "title", language)}
        </h1>
        <p className="text-gray-600 text-sm">
          {language === "bn" ? "ইনভয়েস ও পেমেন্ট ম্যানেজ করুন" : "Manage invoices & payments"}
        </p>
      </div>

      <main className="px-4 space-y-4">
        {/* Payment Overdue Warning */}
        {summary?.paymentOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800 text-sm">
                  {t("billing", "paymentOverdueTitle", language)}
                </h3>
                <p className="text-red-700 text-xs mt-1">
                  {t("billing", "paymentOverdueMessage", language)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">
                {t("billing", "totalUnpaid", language)}
              </p>
              <p className="text-2xl font-bold text-red-600">
                ৳{summary.totalUnpaid.toFixed(0)}
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">
                {t("billing", "overdueInvoices", language)}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {summary.overdueCount}
              </p>
            </div>
          </div>
        )}

        {/* Invoices List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              {t("billing", "invoices", language)}
            </h2>
          </div>

          {invoices.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-gray-50/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {invoice.invoiceNumber}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {formatMonth(invoice.billingMonth)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {invoice.totalCoupons} {t("billing", "coupons", language)} × ৳{invoice.commissionRate}
                      </div>
                      {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                        <div className="text-xs text-gray-500 mt-1">
                          {t("billing", "dueDate", language)}: {formatDate(invoice.dueDate)}
                        </div>
                      )}
                      {invoice.status === "PAID" && invoice.paidAt && (
                        <div className="text-xs text-green-600 mt-1">
                          {t("billing", "paidOn", language)} {formatDate(invoice.paidAt)}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-lg font-bold text-gray-900">
                        ৳{invoice.totalAmount.toFixed(0)}
                      </div>
                      {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                        <button
                          onClick={() => initiatePayment(invoice)}
                          className="mt-2 px-4 py-2 bg-emerald-500 text-white text-xs font-medium rounded-xl hover:bg-emerald-600 transition-colors"
                        >
                          {t("billing", "payNow", language)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-10 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm">
                {t("billing", "noInvoices", language)}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("billing", "payInvoice", language)}
            </h3>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-500">{t("billing", "invoiceNumber", language)}</span>
                <span className="font-mono">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">{t("billing", "amount", language)}</span>
                <span className="font-bold text-lg text-emerald-600">৳{selectedInvoice.totalAmount.toFixed(0)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("billing", "paymentMethod", language)}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["bkash", "nagad", "bank"].map((method) => (
                  <button
                    key={method}
                    onClick={() => {
                      setPaymentMethod(method);
                      initiatePayment(selectedInvoice);
                    }}
                    className={`px-3 py-2.5 text-sm rounded-xl border-2 font-medium transition-colors ${
                      paymentMethod === method
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {method === "bkash" ? "bKash" : method === "nagad" ? "Nagad" : "Bank"}
                  </button>
                ))}
              </div>
            </div>

            {paymentInfo && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2 text-sm">
                  {t("billing", "paymentInstructions", language)}
                </h4>
                <p className="text-xs text-blue-700">{paymentInfo.instructions}</p>
                {paymentInfo.merchantNumber && (
                  <p className="text-sm text-blue-800 font-mono mt-2">
                    {t("billing", "merchantNumber", language)}: {paymentInfo.merchantNumber}
                  </p>
                )}
                {paymentInfo.accountNumber && (
                  <div className="text-xs text-blue-800 mt-2 space-y-1">
                    <p>{t("billing", "bankName", language)}: {paymentInfo.bankName}</p>
                    <p>{t("billing", "accountNumber", language)}: {paymentInfo.accountNumber}</p>
                    <p>{t("billing", "accountName", language)}: {paymentInfo.accountName}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("billing", "transactionId", language)}
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder={t("billing", "enterTransactionId", language)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                  setPaymentInfo(null);
                  setTransactionId("");
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                {t("billing", "cancel", language)}
              </button>
              <button
                onClick={confirmPayment}
                disabled={!transactionId.trim() || confirming}
                className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming ? t("billing", "confirming", language) : t("billing", "confirmPayment", language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="max-w-lg mx-auto flex justify-around">
          <Link href="/restaurant/dashboard" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
              {language === "bn" ? "হোম" : "Home"}
            </span>
          </Link>
          <Link href="/restaurant/validate" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
              {language === "bn" ? "ভেরিফাই" : "Validate"}
            </span>
          </Link>
          <Link href="/restaurant/history" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
              {language === "bn" ? "হিস্ট্রি" : "History"}
            </span>
          </Link>
          <Link href="/restaurant/billing" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs mt-1 text-emerald-600 font-medium">
              {language === "bn" ? "বিলিং" : "Billing"}
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
