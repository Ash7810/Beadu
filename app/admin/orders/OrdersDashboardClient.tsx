"use client";

import { useState } from "react";
import { OrderCardClient, Order } from "./OrderCardClient";

const ALL_STATUSES = [
  { id: "all", label: "All Orders" },
  { id: "confirmed", label: "Confirmed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "draft", label: "Draft" },
];

export function OrdersDashboardClient({ orders }: { orders: Order[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 10;

  // Filter orders by search & status tab
  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
      (o.phone && o.phone.includes(query)) ||
      (o.email && o.email.toLowerCase().includes(query)) ||
      o.id.toLowerCase().includes(query);

    const matchesStatus = selectedStatus === "all" || o.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * ORDERS_PER_PAGE,
    safeCurrentPage * ORDERS_PER_PAGE
  );

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (statusId: string) => {
    setSelectedStatus(statusId);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Control Bar */}
      <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-muted-foreground text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by customer name, phone, order ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-background border border-border/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs min-h-[38px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined text-base">cancel</span>
              </button>
            )}
          </div>

          {/* Records summary pill */}
          <div className="text-xs text-muted-foreground font-semibold px-3 py-2 bg-muted/50 rounded-xl border border-border/40 shrink-0 flex items-center justify-between gap-2">
            <span>Catalog:</span>
            <span className="text-foreground font-bold">{filteredOrders.length} / {orders.length} Records</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-border/40">
          {ALL_STATUSES.map((tab) => {
            const count = tab.id === "all"
              ? orders.length
              : orders.filter((o) => o.status === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleStatusChange(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  selectedStatus === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground border border-border/40"
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-xs space-y-3">
          <span className="material-symbols-outlined text-4xl text-muted-foreground/40">search_off</span>
          <p className="text-foreground font-bold text-sm">No Matching Orders Found</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search criteria or switching the status filter tab above.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedStatus("all");
            }}
            className="text-xs text-primary font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3.5 max-w-5xl mx-auto">
            {paginatedOrders.map((order, idx) => (
              <OrderCardClient
                key={order.id}
                order={order}
                index={(safeCurrentPage - 1) * ORDERS_PER_PAGE + idx + 1}
              />
            ))}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-card border border-border/80 rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-xs">
              <span className="text-muted-foreground font-medium">
                Page <strong className="text-foreground font-bold">{safeCurrentPage}</strong> of {totalPages} ({filteredOrders.length} orders)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                  Previous
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Next
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
