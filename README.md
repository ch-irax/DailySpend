# DailySpend

A little space to keep track of where your money goes.

DailySpend is a premium, mobile-first personal expense journal. Records are saved on your device immediately, then copied to a Google Sheet you own when you connect your Google account.

## Folder structure

```
DailyExpense/
  server/                 OAuth + Google Sheets API (secrets stay here)
  src/
    components/           Dashboard, Expense, Analytics, Export, Navigation, UI
    pages/                Home, Expenses, Analytics, Settings, Add Expense
    services/             auth, sheets, sync, export
    database/indexedDB.ts local-first storage
    hooks/                useExpenses, useSync, useGoogleAccount
    types/                expense models
    utils/                currency, dates, validation
  public/icons/           PWA icons
  .env.example
```

