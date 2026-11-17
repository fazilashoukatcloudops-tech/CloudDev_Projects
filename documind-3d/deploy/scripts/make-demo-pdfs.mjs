import { mkdirSync, writeFileSync } from "node:fs";
const DOCS = {
  "invoice-acme-q3.pdf": ["Invoice 2041 issued to Acme Corporation for Q3 consulting. Invoice total is 4500 dollars, payable within thirty days."],
  "invoice-globex-q4.pdf": ["Invoice 2077 issued to Globex Industries for Q4. Invoice total is 7200 dollars, payable within thirty days."],
  "biology-photosynthesis.pdf": ["Photosynthesis converts sunlight, water and carbon dioxide into glucose and oxygen inside the chloroplasts of plant cells."],
  "contract-lease.pdf": ["This lease agreement is made between the landlord and the tenant for a term of twelve months. Tenant pays monthly rent and security deposit."]
};
const esc = (s) => s.replace(/[\\()]/g, "\\$&");
function build(pages) {
  const o = [];
  o[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  o[2] = "<< /Type /Pages /Kids [" + pages.map((_, i) => (4 + i * 2) + " 0 R").join(" ") + "] /Count " + pages.length + " >>";
  o[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  pages.forEach((text, i) => {
    const id = 4 + i * 2;
    const stream = "BT /F1 12 Tf 72 720 Td (" + esc(text) + ") Tj ET";
    o[id] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents " + (id + 1) + " 0 R >>";
    o[id + 1] = "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream";
  });
  let out = "%PDF-1.4\n"; const off = [];
  for (let id = 1; id < o.length; id++) { off[id] = out.length; out += id + " 0 obj\n" + o[id] + "\nendobj\n"; }
  const x = out.length;
  out += "xref\n0 " + o.length + "\n0000000000 65535 f \n" + off.slice(1).map((n) => String(n).padStart(10, "0") + " 00000 n \n").join("");
  return Buffer.from(out + "trailer\n<< /Size " + o.length + " /Root 1 0 R >>\nstartxref\n" + x + "\n%%EOF\n", "latin1");
}
mkdirSync("docs/sample-data", { recursive: true });
for (const [name, pages] of Object.entries(DOCS)) writeFileSync("docs/sample-data/" + name, build(pages));
console.log("wrote " + Object.keys(DOCS).length + " PDFs");
