"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

interface Invoice {
  id: string;
  invoiceNumber: string;
  restaurantId: string;
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
  restaurant: {
    id: string;
    name: string;
    area: string;
  };
}

interface OverdueStats {
  overdueInvoices: number;
  blockedRestaurants: number;
  approachingDue: number;
  totalUnpaidAmount: number;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<OverdueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function getMonthOptions(): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    }
    return months;
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const authData = await res.json();

        if (!authData.authenticated || authData.user?.type !== "ADMIN") {
          router.push("/admin/login");
          return;
        }

        fetchInvoices();
        fetchStats();
      } catch {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/invoices?month=${selectedMonth}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error("Fetch invoices error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/check-overdue");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedMonth, statusFilter]);

  const generateInvoices = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth }),
      });

      if (res.ok) {
        fetchInvoices();
        fetchStats();
      }
    } catch (error) {
      console.error("Generate invoices error:", error);
    } finally {
      setGenerating(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, action: string) => {
    setActionLoading(invoiceId);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, action }),
      });

      if (res.ok) {
        fetchInvoices();
        fetchStats();
      }
    } catch (error) {
      console.error("Update invoice error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const checkOverdue = async () => {
    try {
      const res = await fetch("/api/admin/check-overdue", {
        method: "POST",
      });

      if (res.ok) {
        fetchInvoices();
        fetchStats();
      }
    } catch (error) {
      console.error("Check overdue error:", error);
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

  if (loading && invoices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <div className="flex gap-3">
            <button
              onClick={checkOverdue}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Check Overdue
            </button>
            <button
              onClick={generateInvoices}
              disabled={generating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Invoices"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">Overdue Invoices</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">Blocked Restaurants</p>
              <p className="text-2xl font-bold text-orange-600">{stats.blockedRestaurants}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">Approaching Due</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.approachingDue}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">Total Unpaid</p>
              <p className="text-2xl font-bold text-indigo-600">৳{stats.totalUnpaidAmount.toFixed(0)}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Billing Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {getMonthOptions().map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoices for {formatMonth(selectedMonth)}
            </h2>
          </div>

          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Restaurant
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Coupons
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-sm text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {invoice.restaurant.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.restaurant.area}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-indigo-600 font-semibold">
                          {invoice.totalCoupons}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="font-semibold text-gray-900">
                          ৳{invoice.totalAmount.toFixed(0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                            invoice.status
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-2">
                          {invoice.status === "DRAFT" && (
                            <button
                              onClick={() => updateInvoiceStatus(invoice.id, "send")}
                              disabled={actionLoading === invoice.id}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Send
                            </button>
                          )}
                          {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                            <button
                              onClick={() => updateInvoiceStatus(invoice.id, "mark_paid")}
                              disabled={actionLoading === invoice.id}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Mark Paid
                            </button>
                          )}
                          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                            <button
                              onClick={() => updateInvoiceStatus(invoice.id, "cancel")}
                              disabled={actionLoading === invoice.id}
                              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                          {invoice.status === "PAID" && (
                            <span className="text-xs text-gray-400">
                              {invoice.paymentMethod || "-"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              No invoices found for {formatMonth(selectedMonth)}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Invoice Workflow</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>1. Click &quot;Generate Invoices&quot; to create invoices for all restaurants with redeemed coupons</li>
            <li>2. Review draft invoices and click &quot;Send&quot; to notify restaurants</li>
            <li>3. Restaurants can pay via bKash, Nagad, or bank transfer</li>
            <li>4. Click &quot;Mark Paid&quot; after receiving payment confirmation</li>
            <li>5. Overdue invoices automatically block restaurant offers</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
