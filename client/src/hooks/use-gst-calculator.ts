import { useCallback } from "react";

export interface GSTCalculation {
  baseAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
}

export function useGSTCalculator() {
  /**
   * Calculate GST for intra-state transactions (CGST + SGST)
   */
  const calculateIntraStateGST = useCallback((amount: number, rate: number): GSTCalculation => {
    const baseAmount = amount;
    const halfRate = rate / 2;
    const cgst = (baseAmount * halfRate) / 100;
    const sgst = (baseAmount * halfRate) / 100;
    const totalTax = cgst + sgst;
    const totalAmount = baseAmount + totalTax;

    return {
      baseAmount,
      cgst,
      sgst,
      igst: 0,
      totalTax,
      totalAmount,
    };
  }, []);

  /**
   * Calculate GST for inter-state transactions (IGST)
   */
  const calculateInterStateGST = useCallback((amount: number, rate: number): GSTCalculation => {
    const baseAmount = amount;
    const igst = (baseAmount * rate) / 100;
    const totalTax = igst;
    const totalAmount = baseAmount + totalTax;

    return {
      baseAmount,
      cgst: 0,
      sgst: 0,
      igst,
      totalTax,
      totalAmount,
    };
  }, []);

  /**
   * Calculate GST based on same state or different state
   */
  const calculateGST = useCallback((
    amount: number,
    rate: number,
    isSameState: boolean = true
  ): GSTCalculation => {
    if (isSameState) {
      return calculateIntraStateGST(amount, rate);
    }
    return calculateInterStateGST(amount, rate);
  }, [calculateIntraStateGST, calculateInterStateGST]);

  /**
   * Calculate total bill with GST breakdown
   */
  const calculateBillWithGST = useCallback((
    items: Array<{ amount: number; gstRate: number; isSameState?: boolean }>
  ) => {
    let totalBaseAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalTax = 0;

    const itemBreakdown = items.map((item) => {
      const calc = calculateGST(item.amount, item.gstRate, item.isSameState ?? true);
      totalBaseAmount += calc.baseAmount;
      totalCGST += calc.cgst;
      totalSGST += calc.sgst;
      totalIGST += calc.igst;
      totalTax += calc.totalTax;

      return {
        ...item,
        ...calc,
      };
    });

    return {
      items: itemBreakdown,
      summary: {
        totalBaseAmount,
        totalCGST,
        totalSGST,
        totalIGST,
        totalTax,
        grandTotal: totalBaseAmount + totalTax,
      },
    };
  }, [calculateGST]);

  /**
   * Get GST rate based on HSN code and product category
   */
  const getGSTRate = useCallback((hsnCode: string, category?: string): number => {
    // Food items
    if (category?.toLowerCase().includes("dairy") || 
        category?.toLowerCase().includes("milk") ||
        hsnCode.startsWith("04")) {
      return 0; // Milk, curd, eggs - 0%
    }
    
    if (category?.toLowerCase().includes("food") || 
        category?.toLowerCase().includes("groceries") ||
        hsnCode.startsWith("10") || 
        hsnCode.startsWith("11")) {
      return 5; // Rice, wheat, pulses - 5%
    }
    
    // Personal care
    if (category?.toLowerCase().includes("personal") || 
        hsnCode.startsWith("33") ||
        hsnCode.startsWith("34")) {
      return 18; // Soaps, cosmetics - 18%
    }
    
    // Electronics
    if (category?.toLowerCase().includes("electronic") || 
        hsnCode.startsWith("85")) {
      return 18; // Electronics - 18%
    }
    
    // Cold drinks
    if (hsnCode.startsWith("2202")) {
      return 28; // Carbonated drinks - 28%
    }
    
    // Default
    return 18;
  }, []);

  /**
   * Validate GSTIN format
   */
  const validateGSTIN = useCallback((gstin: string): boolean => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }, []);

  /**
   * Extract state code from GSTIN
   */
  const getStateFromGSTIN = useCallback((gstin: string): string => {
    if (!validateGSTIN(gstin)) return "";
    const stateCode = gstin.substring(0, 2);
    
    const stateMap: { [key: string]: string } = {
      "01": "Jammu & Kashmir",
      "02": "Himachal Pradesh",
      "03": "Punjab",
      "04": "Chandigarh",
      "05": "Uttarakhand",
      "06": "Haryana",
      "07": "Delhi",
      "08": "Rajasthan",
      "09": "Uttar Pradesh",
      "10": "Bihar",
      "11": "Sikkim",
      "12": "Arunachal Pradesh",
      "13": "Nagaland",
      "14": "Manipur",
      "15": "Mizoram",
      "16": "Tripura",
      "17": "Meghalaya",
      "18": "Assam",
      "19": "West Bengal",
      "20": "Jharkhand",
      "21": "Odisha",
      "22": "Chhattisgarh",
      "23": "Madhya Pradesh",
      "24": "Gujarat",
      "25": "Daman & Diu",
      "26": "Dadra & Nagar Haveli",
      "27": "Maharashtra",
      "28": "Andhra Pradesh",
      "29": "Karnataka",
      "30": "Goa",
      "31": "Lakshadweep",
      "32": "Kerala",
      "33": "Tamil Nadu",
      "34": "Puducherry",
      "35": "Andaman & Nicobar Islands",
      "36": "Telangana",
      "37": "Andhra Pradesh (New)",
    };
    
    return stateMap[stateCode] || "";
  }, [validateGSTIN]);

  return {
    calculateGST,
    calculateIntraStateGST,
    calculateInterStateGST,
    calculateBillWithGST,
    getGSTRate,
    validateGSTIN,
    getStateFromGSTIN,
  };
}
