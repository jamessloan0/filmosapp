import React, { useState } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Receipt, DollarSign, Calendar, Download, Eye, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

const STATUS_CONFIG = {
  sent: { label: "Sent", className: "bg-blue-50 text-blue-700 border-blue-200" },
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue: { label: "Overdue", className: "bg-red-50 text-red-700 border-red-200" },
};

export default function InvoicesTab({ invoices, projectId, projectName, clientName, clientEmail, isClient, onInvoiceCreated, filmmakerName, filmmakerEmail, isPro, onUpgrade }) {
  const [open, setOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ amount: "", description: "", due_date: "" });

  // Free plan: 1 invoice per calendar month across all projects
  const thisMonthInvoiceCount = invoices.filter(inv => {
    if (!inv.created_date) return false;
    const d = new Date(inv.created_date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const atFreeLimit = !isPro && thisMonthInvoiceCount >= 1;

  const handleCreate = async () => {
    if (!form.amount || !form.description || !form.due_date) return;
    setCreating(true);

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    await entities.Invoice.create({
      project_id: projectId,
      amount: parseFloat(form.amount),
      description: form.description,
      due_date: form.due_date,
      status: "sent",
      invoice_number: invoiceNumber,
    });

    await entities.Activity.create({
      project_id: projectId,
      type: "invoice_created",
      description: `Invoice ${invoiceNumber} created for $${form.amount}`,
      actor_name: "Filmmaker",
    });

    setForm({ amount: "", description: "", due_date: "" });
    setCreating(false);
    setOpen(false);
    onInvoiceCreated();
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    await entities.Invoice.update(invoiceId, { status: newStatus });
    onInvoiceCreated();
  };

  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank');
    const statusLabel = (invoice.status || 'sent').charAt(0).toUpperCase() + (invoice.status || 'sent').slice(1);
    const statusColor = invoice.status === 'paid' ? '#059669' : invoice.status === 'overdue' ? '#dc2626' : '#0284c7';
    const fromName = filmmakerName || 'Filmmaker';
    const fromEmail = filmmakerEmail || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #18181b; padding: 0; }
          .page { max-width: 720px; margin: 0 auto; padding: 56px 48px; }
          .top-bar { background: #0ea5e9; height: 6px; width: 100%; margin-bottom: 48px; border-radius: 0 0 4px 4px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
          .brand { display: flex; align-items: center; gap: 10px; }
          .brand-icon { width: 36px; height: 36px; background: #0ea5e9; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
          .brand-name { font-size: 22px; font-weight: 700; color: #18181b; letter-spacing: -0.5px; }
          .invoice-badge { text-align: right; }
          .invoice-label { font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .invoice-number { font-size: 18px; font-weight: 600; color: #18181b; }
          .status-pill { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; color: ${statusColor}; background: ${statusColor}18; border: 1px solid ${statusColor}30; }
          .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; padding: 28px; background: #f8fafc; border-radius: 12px; border: 1px solid #e4e4e7; }
          .party-label { font-size: 10px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .party-name { font-size: 15px; font-weight: 600; color: #18181b; margin-bottom: 2px; }
          .party-sub { font-size: 13px; color: #71717a; }
          .divider { height: 1px; background: #e4e4e7; margin: 32px 0; }
          .meta-row { display: flex; gap: 40px; margin-bottom: 32px; }
          .meta-item { }
          .meta-label { font-size: 10px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .meta-value { font-size: 14px; font-weight: 500; color: #18181b; }
          .amount-block { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 28px 32px; margin-bottom: 24px; }
          .amount-label { font-size: 11px; font-weight: 600; color: #0284c7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .amount-value { font-size: 40px; font-weight: 700; color: #0c4a6e; letter-spacing: -1px; }
          .desc-label { font-size: 10px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .desc-text { font-size: 14px; color: #52525b; line-height: 1.65; }
          .footer { margin-top: 56px; padding-top: 20px; border-top: 1px solid #e4e4e7; display: flex; justify-content: space-between; align-items: center; }
          .footer-brand { font-size: 12px; color: #a1a1aa; }
          .footer-note { font-size: 12px; color: #a1a1aa; }
          @media print { .page { padding: 32px; } }
        </style>
      </head>
      <body>
        <div class="top-bar"></div>
        <div class="page">
          <div class="header">
            <div class="brand">
              <div class="brand-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
              </div>
              <span class="brand-name">FilmOS</span>
            </div>
            <div class="invoice-badge">
              <div class="invoice-label">Invoice</div>
              <div class="invoice-number">${invoice.invoice_number}</div>
              <div class="status-pill">${statusLabel}</div>
            </div>
          </div>

          <div class="parties">
            <div>
              <div class="party-label">From</div>
              <div class="party-name">${fromName}</div>
              <div class="party-sub">${fromEmail}</div>
            </div>
            <div>
              <div class="party-label">Bill To</div>
              <div class="party-name">${clientName || clientEmail}</div>
              <div class="party-sub">${clientEmail}</div>
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-item">
              <div class="meta-label">Project</div>
              <div class="meta-value">${projectName}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Invoice Date</div>
              <div class="meta-value">${format(new Date(invoice.created_date), "MMMM d, yyyy")}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Due Date</div>
              <div class="meta-value">${format(new Date(invoice.due_date), "MMMM d, yyyy")}</div>
            </div>
          </div>

          <div class="amount-block">
            <div class="amount-label">Amount Due</div>
            <div class="amount-value">$${invoice.amount?.toFixed(2)}</div>
          </div>

          <div class="desc-label">Description of Work</div>
          <div class="desc-text">${invoice.description}</div>

          <div class="footer">
            <span class="footer-brand">Generated by FilmOS</span>
            <span class="footer-note">Payment is not processed through FilmOS</span>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Create invoice */}
      {!isClient && (
        <div className="flex justify-end items-center gap-3">
          {atFreeLimit && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              Free plan: 1 invoice/month. <button onClick={onUpgrade} className="font-semibold underline">Upgrade to Pro</button> for unlimited.
            </p>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-zinc-900 hover:bg-zinc-800"
                onClick={atFreeLimit ? (e) => { e.preventDefault(); onUpgrade?.(); } : undefined}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the work or deliverables..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !form.amount || !form.description || !form.due_date}
                  className="w-full bg-zinc-900 hover:bg-zinc-800"
                >
                  {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Receipt className="w-4 h-4 mr-2" />}
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Invoices list */}
      {invoices.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
          <Receipt className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No invoices yet</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
          {invoices.map((invoice) => {
            const statusConf = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.sent;
            return (
              <div key={invoice.id} className="p-5 flex flex-wrap items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-zinc-900">
                      ${invoice.amount?.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400">{invoice.invoice_number}</span>
                  </div>
                  <p className="text-sm text-zinc-500 truncate mt-0.5">{invoice.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar className="w-3 h-3" />
                  Due {format(new Date(invoice.due_date), "MMM d, yyyy")}
                </div>

                {!isClient ? (
                  <Select
                    value={invoice.status || "sent"}
                    onValueChange={(val) => handleStatusChange(invoice.id, val)}
                  >
                    <SelectTrigger className="w-28 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={`${statusConf.className} text-xs`}>
                    {statusConf.label}
                  </Badge>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint(invoice)}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  PDF
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}