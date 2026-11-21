const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, sku, price, qty, hsn, gstRate) {
  return { name, sku, price, qty, hsn, gstRate };
}

function calculate(id, items, coupon) {
  const order = { id, items, coupon };
  return {
    invoice: invoice.computeInvoiceFigures(order),
    billed: pricing.computeTotals(items, coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 applies the same 5% and 18% GST with no coupon', () => {
  const result = calculate(1001, [
    item('Assam CTC Masala Chai 250g', 'BEV-001', 140, 2, '0902', 18),
    item('Unpolished Toor Dal 1kg', 'GRN-002', 165, 2, '0713', 5)
  ], '');

  assert.deepStrictEqual(result.invoice, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });
  assert.strictEqual(result.billed.tax, 66.9);
  assert.strictEqual(result.billed.total, 676.9);
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 to subtotal before GST in the invoice', () => {
  const result = calculate(1002, [
    item('Indrayani Basmati Rice 5kg', 'GRN-001', 640, 1, '1006', 5),
    item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', 190, 2, '1512', 5)
  ], 'SAVE10');

  assert.strictEqual(result.invoice.subtotal, 1020);
  assert.strictEqual(result.invoice.discount, 102);
  assert.strictEqual(result.invoice.tax, 45.9);
  assert.strictEqual(result.invoice.total, 963.9);
  assert.deepStrictEqual(result.invoice.rows.map((row) => row.gstPercent), [5, 5]);
  assert.strictEqual(result.billed.discount, 102);
  assert.strictEqual(result.billed.tax, 45.9);
  assert.strictEqual(result.billed.total, 963.9);
});

test('CURRENT BEHAVIOUR: #1004 applies the SAVE10 maximum discount before GST', () => {
  const result = calculate(1004, [
    item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', 1120, 2, '1508', 5)
  ], 'SAVE10');

  assert.strictEqual(result.invoice.subtotal, 2240);
  assert.strictEqual(result.invoice.discount, 150);
  assert.strictEqual(result.invoice.tax, 104.5);
  assert.strictEqual(result.invoice.total, 2194.5);
  assert.strictEqual(result.billed.discount, 150);
  assert.strictEqual(result.billed.tax, 104.5);
  assert.strictEqual(result.billed.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008 keeps the all-18% no-coupon invoice aligned', () => {
  const result = calculate(1008, [
    item('Assam CTC Masala Chai 250g', 'BEV-001', 140, 1, '0902', 18),
    item('Kokum Sherbet Concentrate 750ml', 'BEV-003', 180, 2, '2106', 18)
  ], '');

  assert.strictEqual(result.invoice.subtotal, 500);
  assert.strictEqual(result.invoice.discount, 0);
  assert.strictEqual(result.invoice.tax, 90);
  assert.strictEqual(result.invoice.total, 590);
  assert.strictEqual(result.billed.tax, 90);
  assert.strictEqual(result.billed.total, 590);
});

test('CORRECT BEHAVIOUR: invoice matches checkout totals and GST for all ticket examples', () => {
  const cases = [
    calculate(1001, [
      item('Assam CTC Masala Chai 250g', 'BEV-001', 140, 2, '0902', 18),
      item('Unpolished Toor Dal 1kg', 'GRN-002', 165, 2, '0713', 5)
    ], ''),
    calculate(1002, [
      item('Indrayani Basmati Rice 5kg', 'GRN-001', 640, 1, '1006', 5),
      item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', 190, 2, '1512', 5)
    ], 'SAVE10'),
    calculate(1004, [
      item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', 1120, 2, '1508', 5)
    ], 'SAVE10'),
    calculate(1008, [
      item('Assam CTC Masala Chai 250g', 'BEV-001', 140, 1, '0902', 18),
      item('Kokum Sherbet Concentrate 750ml', 'BEV-003', 180, 2, '2106', 18)
    ], '')
  ];

  for (const { invoice: invoiceResult, billed } of cases) {
    assert.strictEqual(invoiceResult.subtotal, billed.subtotal);
    assert.strictEqual(invoiceResult.discount, billed.discount);
    assert.strictEqual(invoiceResult.tax, billed.tax);
    assert.strictEqual(invoiceResult.cgst, billed.cgst);
    assert.strictEqual(invoiceResult.sgst, billed.sgst);
    assert.strictEqual(invoiceResult.total, billed.total);
    assert.deepStrictEqual(
      invoiceResult.rows.map((row) => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
      billed.lines.map((line) => ({ gstPercent: line.gstPercent, lineTax: line.tax }))
    );
  }
});
