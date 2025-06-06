export class PDFGenerator {
  constructor() {
    this.doc = new window.jspdf.jsPDF();
  }

  generateQuote(clientInfo, products, total) {
    // En-tête
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(20);
    this.doc.text('Devis Reroflag', 105, 20, { align: 'center' });
    
    // Informations client
    this.doc.setFontSize(12);
    this.doc.text(`Client: ${clientInfo.firstname} ${clientInfo.lastname}`, 20, 40);
    this.doc.text(`Société: ${clientInfo.company}`, 20, 50);
    this.doc.text(`Email: ${clientInfo.email}`, 20, 60);
    this.doc.text(`Téléphone: ${clientInfo.phone}`, 20, 70);

    // Tableau des produits
    const tableColumn = ['Produit', 'Description', 'Prix'];
    const tableRows = products.map(p => [p.name, p.description, `${p.price} €`]);
    
    this.doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [255, 153, 0], // RF-Orange
        textColor: [255, 255, 255],
      }
    });

    // Total
    const finalY = this.doc.lastAutoTable.finalY + 10;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total: ${total} €`, 150, finalY);

    // Pied de page
    this.doc.setFontSize(8);
    this.doc.text('Reroflag - Tous droits réservés', 105, 280, { align: 'center' });

    return this.doc;
  }

  save(filename) {
    this.doc.save(filename);
  }
} 