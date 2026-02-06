import { useEffect, useState } from "react";

export function useCurrency() {
  const [currency, setCurrency] = useState<{
    symbol: string;
    code: string;
    locale: string;
  }>({
    symbol: "₹",
    code: "INR",
    locale: "en-IN",
  });

  useEffect(() => {
    // Fetch store settings from API
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setCurrency({
            symbol: data.currencySymbol || "₹",
            code: data.currencyCode || "INR",
            locale: "en-IN",
          });
        }
      })
      .catch(() => {
        // Fallback to INR
        setCurrency({
          symbol: "₹",
          code: "INR",
          locale: "en-IN",
        });
      });
  }, []);

  const format = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatWithoutSymbol = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  return {
    ...currency,
    format,
    formatWithoutSymbol,
  };
}
