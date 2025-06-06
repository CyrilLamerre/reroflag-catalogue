// Airtable config
const AIRTABLE_BASE = 'appAfAlRJ1IZloDLR';
const AIRTABLE_TABLE = 'Produits';
const AIRTABLE_TOKEN = 'patsEVsHMl8A11ZMW.8970f75424f2f709802900e6bb99f81f20337f564f8326327facfdea26082e9b';

import { PDFGenerator } from './pdfGenerator.js';

// État de l'application
const state = {
  products: [],
  model: null,
  size: null,
  accessories: new Set(),
  prices: { base: 0, accessories: 0 }
};

// Utilitaires
const formatPrice = value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

// Récupérer tous les produits depuis Netlify Function
async function fetchProductsFromAPI() {
  const res = await fetch('/.netlify/functions/getProducts');
  const products = await res.json();
  return products;
}

// Chargement dynamique des modèles
async function loadModels() {
  state.products = await fetchProductsFromAPI();
  const grid = document.getElementById('models-grid');
  grid.innerHTML = '';
  // On récupère les types de modèles uniques (Flag Plume, Flag Goutte, Flag Droit)
  const modelTypes = [...new Set(state.products.filter(p => p.Type.startsWith('Flag')).map(p => p.Type))];
  // On affiche un modèle par type
  modelTypes.forEach(type => {
    // Trouver une taille par défaut pour l'image et la description
    const first = state.products.find(p => p.Type === type);
    const name = type.replace('Flag ', '');
    const image = first && first.Image && first.Image[0] ? first.Image[0].url : '';
    const description = first && first.Descriptif ? first.Descriptif : state.products.filter(p => p.Type === type).map(p => p.Nom).join(', ');
    const card = document.createElement('div');
    card.className = 'model-card cursor-pointer bg-white rounded-xl border-2 border-gray-200 transition p-6 flex flex-col';
    card.dataset.model = type;
    card.innerHTML = `
      <img src="${image}" alt="${name}" class="w-full aspect-[3/4] object-contain mb-4 bg-white rounded-xl" />
      <h3 class="text-lg font-semibold text-center">${name}</h3>
      <div class="text-xs text-gray-500 text-center mb-1">${description || ''}</div>
    `;
    card.addEventListener('click', (event) => {
      document.querySelectorAll('.model-card').forEach(c => c.classList.remove('border-rf-orange', 'selected'));
      card.classList.add('border-rf-orange', 'selected');
      card.classList.remove('border-gray-200');
      selectModel(type, event);
    });
    card.addEventListener('mouseenter', () => {
      if (!card.classList.contains('selected')) {
        card.classList.add('border-rf-orange');
        card.classList.remove('border-gray-200');
      }
    });
    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('selected')) {
        card.classList.remove('border-rf-orange');
        card.classList.add('border-gray-200');
      }
    });
    grid.appendChild(card);
  });

  // Appliquer le style sélectionné pour modèles
  const modelCards = document.querySelectorAll('.model-card');
  modelCards.forEach(c => {
    c.classList.remove('border-rf-orange', 'selected');
    c.classList.add('border-gray-200');
  });
  if (state.model) {
    const selectedCard = Array.from(modelCards).find(card => card.dataset.model === state.model);
    if (selectedCard) {
      selectedCard.classList.add('border-rf-orange', 'selected');
      selectedCard.classList.remove('border-gray-200');
    }
  }
}

function selectModel(modelType, event) {
  document.querySelectorAll('.model-card').forEach(c => c.classList.remove('ring-4', 'ring-rf-orange'));
  event.currentTarget.classList.add('ring-4', 'ring-rf-orange');
  state.model = modelType;
  state.size = null;
  state.accessories.clear();
  state.prices = { base: 0, accessories: 0 };
  document.getElementById('step-sizes').classList.remove('opacity-50', 'pointer-events-none');
  loadSizes(modelType);
  updateTotal();
}

// Chargement dynamique des tailles
async function loadSizes(modelType) {
  const grid = document.getElementById('sizes-grid');
  grid.innerHTML = '';
  // On récupère toutes les tailles pour ce modèle
  const sizes = state.products.filter(p => p.Type === modelType);
  sizes.forEach(sizeObj => {
    const btn = document.createElement('button');
    btn.innerHTML = `
      <div class="font-bold text-lg text-black">${sizeObj.Nom.replace(modelType.replace('Flag ', '') + ' ', '')}</div>
      <div class="text-xs text-gray-500">${sizeObj.Dimension || ''}</div>
      <div class="w-full bg-gray-100 text-black text-center font-bold text-base py-1 mx-2 mt-1 rounded">${formatPrice(sizeObj.Prix)}</div>
    `;
    btn.className = 'size-btn py-2 px-4 pb-4 rounded-xl border-2 border-gray-200 text-center flex flex-col items-center bg-white transition-colors duration-200';
    btn.addEventListener('click', (event) => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('border-rf-orange', 'selected'));
      btn.classList.add('border-rf-orange', 'selected');
      btn.classList.remove('border-gray-200');
      selectSize(sizeObj, event);
    });
    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('selected')) {
        btn.classList.add('border-rf-orange');
        btn.classList.remove('border-gray-200');
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.classList.contains('selected')) {
        btn.classList.remove('border-rf-orange');
        btn.classList.add('border-gray-200');
      }
    });
    grid.appendChild(btn);
  });

  // Appliquer le style sélectionné pour tailles
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach(b => {
    b.classList.remove('border-rf-orange', 'selected');
    b.classList.add('border-gray-200');
  });
  if (state.size) {
    const selectedBtn = Array.from(grid.children).find(btn => btn.querySelector('.font-bold').textContent === state.size.Nom.replace(modelType.replace('Flag ', '') + ' ', ''));
    if (selectedBtn) {
      selectedBtn.classList.add('border-rf-orange', 'selected');
      selectedBtn.classList.remove('border-gray-200');
    }
  }
}

function selectSize(sizeObj, event) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('bg-rf-orange', 'text-white'));
  event.currentTarget.classList.add('bg-rf-orange', 'text-white');
  state.size = sizeObj;
  state.prices.base = sizeObj.Prix;
  document.getElementById('step-accessories').classList.remove('opacity-50', 'pointer-events-none');
  loadAccessories();
  updateTotal();
}

// Chargement dynamique des accessoires
async function loadAccessories() {
  const grid = document.getElementById('accessories-grid');
  grid.innerHTML = '';
  const accessories = state.products.filter(p => p.Type === 'Pieds');
  accessories.forEach(acc => {
    const card = document.createElement('div');
    card.className = 'access-card bg-white rounded-xl p-4 border-2 border-gray-200 flex flex-col transition';
    card.dataset.id = acc.Id;
    const image = acc.Image && acc.Image[0] ? acc.Image[0].url : '';
    card.innerHTML = `
      <img src="${image}" alt="${acc.Nom}" class="w-full aspect-[4/3] object-contain mb-2 bg-white rounded-xl" />
      <h4 class="text-lg font-bold text-center">${acc.Nom}</h4>
      <div class="text-xs text-gray-500 text-center mb-3">${acc.Descriptif || ''}</div>
      <div class="flex justify-between text-xs text-gray-700 mb-0.5 w-full px-2">
        <span>Dimensions :</span>
        <span class="font-semibold">${acc.Dimension || ''}</span>
      </div>
      <div class="border-t border-gray-200 my-1 w-11/12 mx-auto"></div>
      <div class="flex justify-between text-xs text-gray-700 mb-2 w-full px-2">
        <span>Poids :</span>
        <span class="font-semibold">${acc.Poids || ''}</span>
      </div>
      <div class="w-full bg-gray-100 text-black text-center font-bold text-lg py-2 mt-2">${formatPrice(acc.Prix)}</div>
    `;
    card.addEventListener('click', (event) => {
      document.querySelectorAll('.access-card').forEach(c => c.classList.remove('border-rf-orange', 'selected'));
      card.classList.add('border-rf-orange', 'selected');
      card.classList.remove('border-gray-200');
      toggleAccessory(acc, event);
    });
    card.addEventListener('mouseenter', () => {
      if (!card.classList.contains('selected')) {
        card.classList.add('border-rf-orange');
        card.classList.remove('border-gray-200');
      }
    });
    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('selected')) {
        card.classList.remove('border-rf-orange');
        card.classList.add('border-gray-200');
      }
    });
    grid.appendChild(card);
  });

  // Appliquer le style sélectionné pour accessoires
  const accessCards = document.querySelectorAll('.access-card');
  accessCards.forEach(c => {
    c.classList.remove('border-rf-orange', 'selected');
    c.classList.add('border-gray-200');
  });
  state.accessories.forEach(id => {
    const selectedCard = Array.from(accessCards).find(card => card.dataset.id === id);
    if (selectedCard) {
      selectedCard.classList.add('border-rf-orange', 'selected');
      selectedCard.classList.remove('border-gray-200');
    }
  });
}

function toggleAccessory(accessory, event) {
  if (state.accessories.has(accessory.Id)) {
    state.accessories.delete(accessory.Id);
    state.prices.accessories -= accessory.Prix;
    event.currentTarget.classList.remove('ring-4', 'ring-rf-orange');
  } else {
    state.accessories.add(accessory.Id);
    state.prices.accessories += accessory.Prix;
    event.currentTarget.classList.add('ring-4', 'ring-rf-orange');
  }
  updateTotal();
}

// Mise à jour du total
function updateTotal() {
  const total = state.prices.base + state.prices.accessories;
  document.getElementById('total-price').textContent = formatPrice(total);
  document.getElementById('quote-btn').disabled = total === 0;
}

// Génération du devis (PDF uniquement) + enregistrement dans Airtable via Netlify Function
async function generateQuote(clientInfo) {
  try {
    // Récupérer les accessoires sélectionnés
    const selectedAccessories = state.products.filter(p => state.accessories.has(p.Id));
    const products = [
      {
        name: state.size.Nom,
        description: state.model,
        price: state.prices.base
      },
      ...selectedAccessories.map(acc => ({
        name: acc.Nom,
        description: 'Accessoire',
        price: acc.Prix
      }))
    ];
    const pdfGenerator = new PDFGenerator();
    const pdf = pdfGenerator.generateQuote(clientInfo, products, state.prices.base + state.prices.accessories);
    pdf.save('devis-reroflag.pdf');

    // Récupérer le PDF en base64 (sans l'en-tête data:...)
    const pdfBase64 = pdf.output('datauristring').split(',')[1];

    // Enregistrement du devis dans Airtable via Netlify Function
    const response = await fetch('/.netlify/functions/createQuote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...clientInfo,
        total: state.prices.base + state.prices.accessories,
        pdfBase64
      })
    });
    const result = await response.json();
    if (!response.ok) {
      alert('Erreur lors de l\'enregistrement du devis : ' + (result.error || 'Erreur inconnue') + '\n' + (result.details ? JSON.stringify(result.details) : ''));
      return { success: false, error: result };
    }
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la génération du devis:', error);
    alert('Erreur lors de la génération du devis : ' + (error.message || error));
    return { success: false, error };
  }
}

// Gestion de la modale
const modal = document.getElementById('quote-modal');
document.getElementById('quote-btn').addEventListener('click', () => {
  modal.classList.remove('hidden');
  modal.classList.add('flex');
});

document.getElementById('modal-close').addEventListener('click', () => {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
});

document.getElementById('quote-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const clientInfo = {
    firstname: formData.get('firstname'),
    lastname: formData.get('lastname'),
    company: formData.get('company'),
    email: formData.get('email'),
    phone: formData.get('phone')
  };
  const result = await generateQuote(clientInfo);
  if (result.success) {
    alert('Votre devis a été généré et téléchargé !');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  } else {
    alert('Une erreur est survenue lors de la génération du devis.');
  }
});

document.querySelectorAll('.field').forEach(i => {
  i.classList.add('w-full', 'border', 'border-gray-300', 'rounded-lg', 'py-2', 'px-3', 'focus:outline-none', 'focus:ring', 'focus:ring-rf-orange');
});

// Initialisation
loadModels(); 