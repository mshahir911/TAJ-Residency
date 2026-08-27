// Follow Deno and Supabase Edge Function standards
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://cdhrpaunmcyknmrcvqdg.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkaHJwYXVubWN5a25tcmN2cWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODgzMjgsImV4cCI6MjEwMTc2NDMyOH0.5tk15WpxjRgZqlXki1II_EENnm21Bb1FgT0evsOWMXk";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Determine target closing date in Indian Standard Time (IST, UTC+5:30)
    // Default to the day that just concluded
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    // If running shortly after midnight, use yesterday's business date; otherwise today's
    const targetDateObj = body.date ? new Date(body.date) : new Date(nowIST.getTime() - 60 * 1000);
    const targetDate = targetDateObj.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
    const propertyId = body.property_id || "taj-residency-calicut";

    console.log(`[EOD Report] Processing End-of-Day Audit for Date: ${targetDate}, Property: ${propertyId}`);

    // 1. Fetch Property Details
    const { data: property } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    const hotelName = property?.name || "Taj Residency";
    const hotelAddress = property?.address || "NH 766, Adivaram, Kozhikode, Kerala 673586";
    const gstin = property?.gst_number || "32AABCT9988Q1Z4";

    // 2. Fetch Invoices for targetDate
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("property_id", propertyId);

    const dateInvoices = (invoices || []).filter((inv: any) =>
      (inv.paid_at || "").startsWith(targetDate)
    );

    // 3. Fetch Bookings for targetDate
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("property_id", propertyId);

    const checkInsCount = (bookings || []).filter((b: any) =>
      (b.check_in_date || "").startsWith(targetDate)
    ).length;

    const advancesOnDate = (bookings || []).filter((b: any) => {
      const d = (b.created_at || b.check_in_date || "").slice(0, 10);
      return d === targetDate && Number(b.advance_paid) > 0;
    });

    // 4. Fetch Rooms count
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id, status")
      .eq("property_id", propertyId);

    const totalRooms = rooms?.length || 11;

    // 5. Fetch Shift Logs for targetDate
    const { data: shiftLogs } = await supabase
      .from("shift_logs")
      .select("*")
      .eq("property_id", propertyId);

    const dateShiftLogs = (shiftLogs || []).filter((s: any) =>
      (s.date || "").startsWith(targetDate)
    );

    // 6. Fetch Expenses for targetDate
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("property_id", propertyId);

    const dateExpenses = (expenses || []).filter((e: any) =>
      (e.date || "").startsWith(targetDate)
    );

    // Financial calculations
    let cashCollections = 0;
    let upiCollections = 0;
    let cardCollections = 0;
    let grossRoomCharge = 0;
    let discountTotal = 0;
    let gstTotal = 0;

    dateInvoices.forEach((inv: any) => {
      const settled = Number(inv.balance_settled !== undefined ? inv.balance_settled : inv.total) || 0;
      const mode = (inv.payment_mode || "UPI").toLowerCase();
      if (mode.includes("cash")) cashCollections += settled;
      else if (mode.includes("upi") || mode.includes("gpay") || mode.includes("phonepe") || mode.includes("qr")) upiCollections += settled;
      else cardCollections += settled;

      grossRoomCharge += Number(inv.gross_room_charge || inv.room_charge || 0);
      discountTotal += Number(inv.discount_amount || 0);
      gstTotal += Number(inv.gst_amount || 0);
    });

    advancesOnDate.forEach((b: any) => {
      const adv = Number(b.advance_paid || 0);
      const mode = (b.payment_mode || "UPI").toLowerCase();
      if (mode.includes("cash")) cashCollections += adv;
      else if (mode.includes("upi") || mode.includes("gpay") || mode.includes("phonepe") || mode.includes("qr")) upiCollections += adv;
      else cardCollections += adv;
    });

    const totalRevenue = cashCollections + upiCollections + cardCollections;
    const totalExpenses = dateExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const cashDiscrepancy = dateShiftLogs.reduce((sum: number, s: any) => sum + Number(s.discrepancy || 0), 0);
    const checkOutsCount = dateInvoices.length;

    // Occupancy estimation for date
    const activeStays = (bookings || []).filter((b: any) => {
      const inDate = (b.check_in_date || "").slice(0, 10);
      const outDate = (b.check_out_date || "").slice(0, 10);
      return inDate <= targetDate && outDate >= targetDate && b.status !== "cancelled";
    }).length;
    const occupancyPct = Math.min(100, Math.round((activeStays / totalRooms) * 100));

    // Compile WhatsApp Summary Text
    const summaryText = `🏛️ *${hotelName.toUpperCase()} — OFFICIAL EOD AUDIT REPORT*
📅 *Business Date:* ${targetDate}

💰 *COLLECTIONS & REVENUE:*
• 💵 Cash in Drawer: ₹${cashCollections.toLocaleString('en-IN')}
• 📱 UPI / GPay / QR: ₹${upiCollections.toLocaleString('en-IN')}
• 💳 Card / POS / Bank: ₹${cardCollections.toLocaleString('en-IN')}
• *Total Collections:* *₹${totalRevenue.toLocaleString('en-IN')}*

📊 *REVENUE & TAX LEDGER:*
• Gross Tariff: ₹${grossRoomCharge.toLocaleString('en-IN')}
${discountTotal > 0 ? `• Concessions/Discounts: -₹${discountTotal.toLocaleString('en-IN')}\n` : ''}• GST Collected (12%): ₹${gstTotal.toLocaleString('en-IN')}

🏨 *OPERATIONAL VOLUME:*
• Check-ins Today: *${checkInsCount}*
• Check-outs Settled: *${checkOutsCount}*
• Occupancy: *${occupancyPct}%* (${totalRooms} Room Inventory)
${totalExpenses > 0 ? `• Expenses Deducted: -₹${totalExpenses.toLocaleString('en-IN')}\n` : ''}${cashDiscrepancy !== 0 ? `⚠️ Cash Drawer Discrepancy: ₹${cashDiscrepancy}\n` : '✅ Cash Drawer: Exact Match\n'}
GSTIN: ${gstin} | SAC: 996311
_Automated Midnight Rollover • Taj Residency FrontDesk OS_`;

    // Compile Self-Contained HTML Report with PaperInvoice Palette
    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>EOD Report - ${targetDate} - ${hotelName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F4F6F9; color: #11161D; margin: 0; padding: 24px; }
    .wrapper { max-width: 800px; margin: 0 auto; background: #F2EFE6; border: 1px solid #D5D0C2; border-radius: 12px; padding: 32px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    h1 { font-family: Georgia, serif; font-size: 24px; text-transform: uppercase; margin: 0; }
    .badge { background: #11161D; color: #C9A24B; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: monospace; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .kpi-card { background: #fff; border: 1px solid #D5D0C2; border-radius: 8px; padding: 12px; text-align: center; }
    .kpi-val { font-size: 20px; font-weight: 800; color: #11161D; font-family: Georgia, serif; }
    .kpi-lbl { font-size: 10px; color: #666; font-family: monospace; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; background: #fff; border: 1px solid #D5D0C2; font-size: 12px; font-family: monospace; }
    th { background: #FAF8F5; padding: 8px; border-bottom: 1px solid #D5D0C2; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #11161D; padding-bottom: 16px;">
      <div>
        <h1>${hotelName}</h1>
        <p style="font-size: 12px; color: #555; margin: 4px 0;">${hotelAddress}</p>
        <p style="font-size: 11px; color: #555; margin: 0;">GSTIN: <strong>${gstin}</strong> | SAC: <strong>996311</strong></p>
      </div>
      <div style="text-align: right;">
        <span class="badge">END-OF-DAY AUDIT</span>
        <div style="margin-top: 6px; font-size: 14px; font-weight: bold;">${targetDate}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-lbl">Total Collections</div><div class="kpi-val">Rs. ${totalRevenue.toLocaleString('en-IN')}</div></div>
      <div class="kpi-card"><div class="kpi-lbl">Occupancy</div><div class="kpi-val">${occupancyPct}%</div></div>
      <div class="kpi-card"><div class="kpi-lbl">Check-Ins / Outs</div><div class="kpi-val">${checkInsCount} / ${checkOutsCount}</div></div>
      <div class="kpi-card"><div class="kpi-lbl">GST Collected</div><div class="kpi-val">Rs. ${gstTotal.toLocaleString('en-IN')}</div></div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div style="background: #fff; border: 1px solid #D5D0C2; border-radius: 8px; padding: 16px; font-size: 12px; font-family: monospace;">
        <h3 style="margin-top: 0; font-family: Georgia, serif; font-size: 14px;">Collections Split</h3>
        <div>Cash in Drawer: <strong>Rs. ${cashCollections.toLocaleString('en-IN')}</strong></div>
        <div style="margin: 6px 0;">UPI / QR: <strong>Rs. ${upiCollections.toLocaleString('en-IN')}</strong></div>
        <div>Card / POS: <strong>Rs. ${cardCollections.toLocaleString('en-IN')}</strong></div>
      </div>
      <div style="background: #fff; border: 1px solid #D5D0C2; border-radius: 8px; padding: 16px; font-size: 12px; font-family: monospace;">
        <h3 style="margin-top: 0; font-family: Georgia, serif; font-size: 14px;">Cash Drawer Status</h3>
        <div>Gross Cash: Rs. ${cashCollections.toLocaleString('en-IN')}</div>
        <div style="margin: 6px 0;">Expenses: -Rs. ${totalExpenses.toLocaleString('en-IN')}</div>
        <div>Tally: <strong>${cashDiscrepancy === 0 ? 'Exact Match' : 'Discrepancy Rs. ' + cashDiscrepancy}</strong></div>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Invoice #</th><th>Room</th><th>Guest</th><th>Nights</th><th>Mode</th><th style="text-align: right;">Total</th></tr>
      </thead>
      <tbody>
        ${dateInvoices.map((i: any) => `<tr><td>${i.id}</td><td>Room ${i.room_number}</td><td>${i.guest_name}</td><td>${i.nights}</td><td>${i.payment_mode}</td><td style="text-align: right;">Rs. ${i.total}</td></tr>`).join('')}
      </tbody>
    </table>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #D5D0C2; font-size: 11px; color: #666; font-family: monospace; display: flex; justify-content: space-between;">
      <div>Owner: Muhammed Shahir (mshahir911@gmail.com | +91 8590650154)</div>
      <div>Taj Residency FrontDesk OS</div>
    </div>
  </div>
</body>
</html>`;

    // 7. Store EOD Snapshot in public.eod_reports table
    const eodId = `eod-${targetDate.replace(/-/g, '')}-${propertyId}`;
    const { error: upsertError } = await supabase
      .from("eod_reports")
      .upsert({
        id: eodId,
        property_id: propertyId,
        report_date: targetDate,
        total_revenue: totalRevenue,
        cash_revenue: cashCollections,
        upi_revenue: upiCollections,
        card_revenue: cardCollections,
        gst_collected: gstTotal,
        concessions_total: discountTotal,
        check_ins_count: checkInsCount,
        check_outs_count: checkOutsCount,
        occupancy_pct: occupancyPct,
        cash_discrepancy: cashDiscrepancy,
        summary_text: summaryText,
        report_html: reportHtml,
        created_at: new Date().toISOString()
      });

    if (upsertError) {
      console.warn("[EOD Report] Could not save row to eod_reports table:", upsertError.message);
    } else {
      console.log(`[EOD Report] Archived row successfully into eod_reports: ${eodId}`);
    }

    // 8. Dispatch Email to mshahir911@gmail.com via Resend API (if configured)
    let emailStatus = "skipped_no_key";
    if (resendApiKey) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Taj Residency PMS <reports@tajresidency.com>",
            to: ["mshahir911@gmail.com"],
            subject: `[EOD REPORT] ${hotelName} — Daily Closing ${targetDate}`,
            html: reportHtml
          })
        });
        if (emailRes.ok) {
          emailStatus = "sent";
          console.log("[EOD Report] Email dispatched to mshahir911@gmail.com successfully");
        } else {
          emailStatus = `failed: ${emailRes.status}`;
          console.warn("[EOD Report] Email dispatch failed:", await emailRes.text());
        }
      } catch (err: any) {
        emailStatus = `error: ${err.message}`;
      }
    }

    // 9. Prepare WhatsApp link
    const whatsappPhone = "918590650154";
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(summaryText)}`;

    return new Response(
      JSON.stringify({
        success: true,
        propertyId,
        reportDate: targetDate,
        totalRevenue,
        cashCollections,
        upiCollections,
        cardCollections,
        gstTotal,
        discountTotal,
        checkInsCount,
        checkOutsCount,
        occupancyPct,
        cashDiscrepancy,
        emailStatus,
        whatsappUrl,
        archivedId: eodId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    console.error("[EOD Report] Serverless function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
