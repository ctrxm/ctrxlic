import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Locale = "en" | "id";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.products": "Products",
    "nav.licenses": "Licenses",
    "nav.apiKeys": "API Keys",
    "nav.statistics": "Statistics",
    "nav.apiDocs": "API Docs",
    "nav.sdkDownloads": "SDK Downloads",
    "nav.webhooks": "Webhooks",
    "nav.mainMenu": "Main Menu",
    "nav.admin": "Admin",
    "nav.overview": "Overview",
    "nav.allUsers": "All Users",
    "nav.allLicenses": "All Licenses",
    "nav.auditLogs": "Audit Logs",
    "nav.settings": "Settings",
    "nav.upgradePro": "Upgrade to Pro",
    "nav.unlockUnlimited": "Unlock unlimited products & licenses",
    "nav.contactTelegram": "Contact Telegram",
    "nav.licenseManager": "License Manager",

    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome back",
    "dashboard.totalProducts": "Total Products",
    "dashboard.totalLicenses": "Total Licenses",
    "dashboard.activeLicenses": "Active Licenses",
    "dashboard.totalApiKeys": "Total API Keys",
    "dashboard.totalActivations": "Total Activations",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.recentLicenses": "Recent Licenses",
    "dashboard.recentProducts": "Recent Products",

    "licenses.title": "Licenses",
    "licenses.subtitle": "Manage your software licenses",
    "licenses.generate": "Generate License",
    "licenses.search": "Search licenses...",
    "licenses.noLicenses": "No licenses found",
    "licenses.noLicensesDesc": "Generate your first license to get started",
    "licenses.adjustFilters": "Try adjusting your filters",
    "licenses.licenseKey": "License Key",
    "licenses.product": "Product",
    "licenses.type": "Type",
    "licenses.customer": "Customer",
    "licenses.status": "Status",
    "licenses.activations": "Activations",
    "licenses.expires": "Expires",
    "licenses.actions": "Actions",
    "licenses.renew": "Renew",
    "licenses.renewTitle": "Renew License",
    "licenses.renewDesc": "Extend the expiration date for this license",
    "licenses.newExpiryDate": "New Expiry Date",
    "licenses.renewSuccess": "License renewed successfully",
    "licenses.renewing": "Renewing...",
    "licenses.never": "Never",
    "licenses.allStatus": "All Status",
    "licenses.active": "Active",
    "licenses.expired": "Expired",
    "licenses.revoked": "Revoked",
    "licenses.suspended": "Suspended",
    "licenses.copy": "Copy",
    "licenses.copied": "Copied",

    "products.title": "Products",
    "products.subtitle": "Manage your software products",
    "products.create": "Create Product",
    "products.noProducts": "No products found",

    "statistics.title": "Statistics",
    "statistics.subtitle": "Detailed analytics for your licenses",
    "statistics.validationHeatmap": "Validation Heatmap",
    "statistics.heatmapDesc": "License validation activity over the last 30 days",
    "statistics.noHeatmapData": "No validation data yet",
    "statistics.licensesOverTime": "Licenses Over Time",
    "statistics.activationsOverTime": "Activations Over Time",
    "statistics.licensesByType": "Licenses by Type",
    "statistics.licensesByStatus": "Licenses by Status",
    "statistics.topProducts": "Top Products",

    "apiKeys.title": "API Keys",
    "apiKeys.subtitle": "Manage API keys for license validation",

    "settings.title": "Admin Settings",
    "settings.plans": "Plans",
    "settings.platform": "Platform",
    "settings.security": "Security",
    "settings.general": "General",
    "settings.userPlans": "User Plans",
    "settings.telegram": "Telegram",
    "settings.telegramTitle": "Telegram Notifications",
    "settings.telegramDesc": "Send real-time license events to your Telegram channel",
    "settings.botToken": "Bot Token",
    "settings.botTokenPlaceholder": "Enter your Telegram Bot Token",
    "settings.chatId": "Chat ID",
    "settings.chatIdPlaceholder": "Enter your Telegram Chat ID",
    "settings.enableNotifications": "Enable Notifications",
    "settings.testNotification": "Send Test Notification",
    "settings.testing": "Sending...",
    "settings.save": "Save Settings",
    "settings.saving": "Saving...",
    "settings.saved": "Settings saved",
    "settings.testSuccess": "Test notification sent successfully",
    "settings.telegramEvents": "Events that trigger notifications:",
    "settings.eventCreated": "License Created",
    "settings.eventActivated": "License Activated",
    "settings.eventExpired": "License Expired",
    "settings.eventRenewed": "License Renewed",

    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.success": "Success",
    "common.error": "Error",
    "common.logout": "Logout",
    "common.language": "Language",
    "common.english": "English",
    "common.indonesian": "Bahasa Indonesia",

    "days.sun": "Sun",
    "days.mon": "Mon",
    "days.tue": "Tue",
    "days.wed": "Wed",
    "days.thu": "Thu",
    "days.fri": "Fri",
    "days.sat": "Sat",
  },
  id: {
    "nav.dashboard": "Dasbor",
    "nav.products": "Produk",
    "nav.licenses": "Lisensi",
    "nav.apiKeys": "Kunci API",
    "nav.statistics": "Statistik",
    "nav.apiDocs": "Dok. API",
    "nav.sdkDownloads": "Unduh SDK",
    "nav.webhooks": "Webhook",
    "nav.mainMenu": "Menu Utama",
    "nav.admin": "Admin",
    "nav.overview": "Ringkasan",
    "nav.allUsers": "Semua Pengguna",
    "nav.allLicenses": "Semua Lisensi",
    "nav.auditLogs": "Log Audit",
    "nav.settings": "Pengaturan",
    "nav.upgradePro": "Upgrade ke Pro",
    "nav.unlockUnlimited": "Buka produk & lisensi tak terbatas",
    "nav.contactTelegram": "Hubungi Telegram",
    "nav.licenseManager": "Manajer Lisensi",

    "dashboard.title": "Dasbor",
    "dashboard.welcome": "Selamat datang kembali",
    "dashboard.totalProducts": "Total Produk",
    "dashboard.totalLicenses": "Total Lisensi",
    "dashboard.activeLicenses": "Lisensi Aktif",
    "dashboard.totalApiKeys": "Total Kunci API",
    "dashboard.totalActivations": "Total Aktivasi",
    "dashboard.quickActions": "Aksi Cepat",
    "dashboard.recentLicenses": "Lisensi Terbaru",
    "dashboard.recentProducts": "Produk Terbaru",

    "licenses.title": "Lisensi",
    "licenses.subtitle": "Kelola lisensi perangkat lunak Anda",
    "licenses.generate": "Buat Lisensi",
    "licenses.search": "Cari lisensi...",
    "licenses.noLicenses": "Tidak ada lisensi ditemukan",
    "licenses.noLicensesDesc": "Buat lisensi pertama Anda untuk memulai",
    "licenses.adjustFilters": "Coba sesuaikan filter Anda",
    "licenses.licenseKey": "Kunci Lisensi",
    "licenses.product": "Produk",
    "licenses.type": "Tipe",
    "licenses.customer": "Pelanggan",
    "licenses.status": "Status",
    "licenses.activations": "Aktivasi",
    "licenses.expires": "Kedaluwarsa",
    "licenses.actions": "Aksi",
    "licenses.renew": "Perpanjang",
    "licenses.renewTitle": "Perpanjang Lisensi",
    "licenses.renewDesc": "Perpanjang tanggal kedaluwarsa lisensi ini",
    "licenses.newExpiryDate": "Tanggal Kedaluwarsa Baru",
    "licenses.renewSuccess": "Lisensi berhasil diperpanjang",
    "licenses.renewing": "Memproses...",
    "licenses.never": "Selamanya",
    "licenses.allStatus": "Semua Status",
    "licenses.active": "Aktif",
    "licenses.expired": "Kedaluwarsa",
    "licenses.revoked": "Dicabut",
    "licenses.suspended": "Ditangguhkan",
    "licenses.copy": "Salin",
    "licenses.copied": "Tersalin",

    "products.title": "Produk",
    "products.subtitle": "Kelola produk perangkat lunak Anda",
    "products.create": "Buat Produk",
    "products.noProducts": "Tidak ada produk ditemukan",

    "statistics.title": "Statistik",
    "statistics.subtitle": "Analitik detail untuk lisensi Anda",
    "statistics.validationHeatmap": "Peta Panas Validasi",
    "statistics.heatmapDesc": "Aktivitas validasi lisensi selama 30 hari terakhir",
    "statistics.noHeatmapData": "Belum ada data validasi",
    "statistics.licensesOverTime": "Lisensi dari Waktu ke Waktu",
    "statistics.activationsOverTime": "Aktivasi dari Waktu ke Waktu",
    "statistics.licensesByType": "Lisensi berdasarkan Tipe",
    "statistics.licensesByStatus": "Lisensi berdasarkan Status",
    "statistics.topProducts": "Produk Teratas",

    "apiKeys.title": "Kunci API",
    "apiKeys.subtitle": "Kelola kunci API untuk validasi lisensi",

    "settings.title": "Pengaturan Admin",
    "settings.plans": "Paket",
    "settings.platform": "Platform",
    "settings.security": "Keamanan",
    "settings.general": "Umum",
    "settings.userPlans": "Paket Pengguna",
    "settings.telegram": "Telegram",
    "settings.telegramTitle": "Notifikasi Telegram",
    "settings.telegramDesc": "Kirim notifikasi lisensi real-time ke channel Telegram Anda",
    "settings.botToken": "Token Bot",
    "settings.botTokenPlaceholder": "Masukkan Token Bot Telegram Anda",
    "settings.chatId": "Chat ID",
    "settings.chatIdPlaceholder": "Masukkan Chat ID Telegram Anda",
    "settings.enableNotifications": "Aktifkan Notifikasi",
    "settings.testNotification": "Kirim Notifikasi Tes",
    "settings.testing": "Mengirim...",
    "settings.save": "Simpan Pengaturan",
    "settings.saving": "Menyimpan...",
    "settings.saved": "Pengaturan tersimpan",
    "settings.testSuccess": "Notifikasi tes berhasil dikirim",
    "settings.telegramEvents": "Event yang memicu notifikasi:",
    "settings.eventCreated": "Lisensi Dibuat",
    "settings.eventActivated": "Lisensi Diaktifkan",
    "settings.eventExpired": "Lisensi Kedaluwarsa",
    "settings.eventRenewed": "Lisensi Diperpanjang",

    "common.loading": "Memuat...",
    "common.save": "Simpan",
    "common.cancel": "Batal",
    "common.delete": "Hapus",
    "common.edit": "Ubah",
    "common.close": "Tutup",
    "common.confirm": "Konfirmasi",
    "common.success": "Berhasil",
    "common.error": "Kesalahan",
    "common.logout": "Keluar",
    "common.language": "Bahasa",
    "common.english": "English",
    "common.indonesian": "Bahasa Indonesia",

    "days.sun": "Min",
    "days.mon": "Sen",
    "days.tue": "Sel",
    "days.wed": "Rab",
    "days.thu": "Kam",
    "days.fri": "Jum",
    "days.sat": "Sab",
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("ctrxl_locale");
    return (saved === "id" || saved === "en") ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem("ctrxl_locale", locale);
  }, [locale]);

  const t = (key: string): string => {
    return translations[locale][key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export type { Locale };
