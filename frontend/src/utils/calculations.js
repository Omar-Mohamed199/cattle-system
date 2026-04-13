export const calculateCustomerFinances = (cowWeight, partner, cowDbId, payments) => {
  const cW = parseFloat(cowWeight) || 0;
  const share = parseFloat(partner.share) || 0;
  const price = parseFloat(partner.price) || 0;
  const slaughterCostShare = parseFloat(partner.slaughterCostShare) || 0;

  const customerWeight = cW * (share / 100);
  const totalBeforeSlaughter = customerWeight * price;
  const customerTotal = totalBeforeSlaughter + slaughterCostShare;

  let paidAmount = 0;
  if (cowDbId && partner.customerId) {
    const custIdStr = typeof partner.customerId === 'object' ? partner.customerId._id || partner.customerId : partner.customerId;
    
    const custPays = payments.filter(p => {
      const pCowId = p.cowId?._id || p.cowId;
      const pCustId = p.customerId?._id || p.customerId;
      return pCowId === cowDbId && pCustId === custIdStr;
    });
    
    paidAmount = custPays.reduce((acc, curr) => acc + curr.amount, 0);
  }

  const remaining = customerTotal - paidAmount;

  console.log(`[DEBUG] Customer Finance - CowID: ${cowDbId}, Customer: ${partner.customerId}`);
  console.log(`        Weight: ${customerWeight}, Total: ${customerTotal}, Paid: ${paidAmount}, Rem: ${remaining}`);

  return {
    customerWeight,
    totalBeforeSlaughter,
    customerTotal, // This is 'إجمالي العميل'
    slaughterCostShare,
    paidAmount,
    remaining
  };
};
