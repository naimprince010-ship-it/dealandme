"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RestaurantNav from "@/components/RestaurantNav";
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
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[parseInt(m) - 1]} ${year}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantNav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("billing", "title", language)}
        </h1>

        {/* Payment Overdue Warning */}
        {summary?.paymentOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-red-500 text-2xl">!</div>
              <div>
                <h3 className="font-semibold text-red-800">
                  {t("billing", "paymentOverdueTitle", language)}
                </h3>
                <p className="text-red-700 text-sm mt-1">
                  {t("billing", "paymentOverdueMessage", language)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">
                {t("billing", "totalUnpaid", language)}
              </p>
              <p className="text-2xl font-bold text-red-600">
                ৳{summary.totalUnpaid.toFixed(0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">
                {t("billing", "overdueInvoices", language)}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {summary.overdueCount}
              </p>
            </div>
          </div>
        )}

        {/* Invoices List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("billing", "invoices", language)}
            </h2>
          </div>

          {invoices.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm text-gray-600">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="font-medium text-gray-900 mt-1">
                        {formatMonth(invoice.billingMonth)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {invoice.totalCoupons} {t("billing", "coupons", language)} × ৳{invoice.commissionRate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        ৳{invoice.totalAmount.toFixed(0)}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                            invoice.status
                          )}`}
                        >
                          {getStatusText(invoice.status)}
                        </span>
                      </div>
                      {invoice.status === "SENT" || invoice.status === "OVERDUE" ? (
                        <button
                          onClick={() => initiatePayment(invoice)}
                          className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                        >
                          {t("billing", "payNow", language)}
                        </button>
                      ) : invoice.status === "PAID" ? (
                        <div className="text-xs text-gray-500 mt-2">
                          {t("billing", "paidOn", language)} {formatDate(invoice.paidAt!)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                    <div className="mt-2 text-sm text-gray-500">
                      {t("billing", "dueDate", language)}: {formatDate(invoice.dueDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              {t("billing", "noInvoices", language)}
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t("billing", "payInvoice", language)}
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">{t("billing", "invoiceNumber", language)}</span>
                  <span className="font-mono">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("billing", "amount", language)}</span>
                  <span className="font-bold text-lg">৳{selectedInvoice.totalAmount.toFixed(0)}</span>
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
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        paymentMethod === method
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {method === "bkash" ? "bKash" : method === "nagad" ? "Nagad" : "Bank"}
                    </button>
                  ))}
                </div>
              </div>

              {paymentInfo && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {t("billing", "paymentInstructions", language)}
                  </h4>
                  <p className="text-sm text-blue-700">{paymentInfo.instructions}</p>
                  {paymentInfo.merchantNumber && (
                    <p className="text-sm text-blue-800 font-mono mt-2">
                      {t("billing", "merchantNumber", language)}: {paymentInfo.merchantNumber}
                    </p>
                  )}
                  {paymentInfo.accountNumber && (
                    <div className="text-sm text-blue-800 mt-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t("billing", "cancel", language)}
                </button>
                <button
                  onClick={confirmPayment}
                  disabled={!transactionId.trim() || confirming}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {confirming ? t("billing", "confirming", language) : t("billing", "confirmPayment", language)}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
