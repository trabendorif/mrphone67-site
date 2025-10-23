// Variables globales
let currentSection = 1;
let clientNumber = '';
let signaturePad = null;
let isDrawing = false;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initializeSignaturePad();
    generateClientNumber();
    setupFormValidation();
});

// Navigation entre les sections
function nextSection(sectionNumber) {
    if (validateCurrentSection()) {
        showSection(sectionNumber);
    }
}

function previousSection(sectionNumber) {
    showSection(sectionNumber);
}

function showSection(sectionNumber) {
    // Masquer toutes les sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Masquer tous les steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Afficher la section demandée
    document.getElementById(`section-${sectionNumber}`).classList.add('active');
    document.querySelector(`[data-step="${sectionNumber}"]`).classList.add('active');
    
    currentSection = sectionNumber;
    
    // Scroll vers le haut
    window.scrollTo(0, 0);
}

// Validation des sections
function validateCurrentSection() {
    const currentSectionElement = document.getElementById(`section-${currentSection}`);
    const requiredFields = currentSectionElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            field.style.borderColor = '#27ae60';
        }
    });
    
    if (!isValid) {
        alert('Veuillez remplir tous les champs obligatoires.');
    }
    
    return isValid;
}

// Configuration de la validation en temps réel
function setupFormValidation() {
    const inputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#27ae60';
            } else {
                this.style.borderColor = '#e74c3c';
            }
        });
        
        input.addEventListener('input', function() {
            if (this.style.borderColor === 'rgb(231, 76, 60)' && this.value.trim()) {
                this.style.borderColor = '#27ae60';
            }
        });
    });
}

// Initialisation de la signature tactile
function initializeSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    
    // Configuration du canvas
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Événements pour desktop
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Événements pour mobile/tablette
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    function handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                        e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
}

// Effacer la signature
function clearSignature() {
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Scanner IMEI (simulation)
function scanIMEI() {
    // Simulation d'un scanner IMEI/QR Code
    const imeiField = document.getElementById('imeiNumber');
    
    // Dans un vrai projet, ici on intégrerait une bibliothèque de scan QR/code-barres
    // Pour la démo, on génère un IMEI fictif
    const simulatedIMEI = generateRandomIMEI();
    
    imeiField.value = simulatedIMEI;
    imeiField.style.borderColor = '#27ae60';
    
    // Animation de scan
    const scanButton = document.querySelector('.btn-scan');
    scanButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scan...';
    
    setTimeout(() => {
        scanButton.innerHTML = '<i class="fas fa-qrcode"></i> Scanner';
        alert(`IMEI scanné: ${simulatedIMEI}`);
    }, 2000);
}

// Génération d'un IMEI fictif pour la démo
function generateRandomIMEI() {
    let imei = '';
    for (let i = 0; i < 15; i++) {
        imei += Math.floor(Math.random() * 10);
    }
    return imei;
}

// Génération du numéro client
function generateClientNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    clientNumber = `RC${year}${month}${day}${random}`;
}

// Fonction pour finaliser le ticket avec sauvegarde en base de données
async function generateTicket() {
    if (!validateCurrentSection()) {
        return;
    }
    
    // Vérifier la signature
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasSignature = imageData.data.some(channel => channel !== 0);
    
    if (!hasSignature) {
        alert('Veuillez signer avant de finaliser la prise en charge.');
        return;
    }
    
    // Validation des données
    const clientData = collectClientData();
    const deviceData = collectDeviceData();
    const repairData = collectRepairData();
    
    if (!validateAllData(clientData, deviceData, repairData)) {
        return;
    }
    
    // Générer le numéro de client
    generateClientNumber();
    
    // Afficher le loader
    showLoader('Enregistrement en cours...');
    
    try {
        // Préparer les données pour l'API
        const ticketData = {
            client: clientData,
            device: deviceData,
            repair: repairData,
            signature: canvas.toDataURL() // Signature en base64
        };
        
        // Simuler l'enregistrement local si pas de base de données
        if (typeof fetch === 'undefined' || !window.navigator.onLine) {
            // Mode hors ligne - enregistrement local
            const ticketNumber = 'MRP' + Date.now().toString().slice(-6);
            
            // Stocker les données du ticket pour l'affichage
            currentTicket = {
                ...ticketData,
                numero_ticket: ticketNumber,
                date_creation: new Date().toLocaleString('fr-FR')
            };
            
            hideLoader();
            showNotification('Ticket créé en mode local: ' + ticketNumber, 'success');
            
            // Afficher les actions finales
            showFinalActions();
            return;
        }
        
        // Envoyer à l'API avec gestion d'erreur améliorée
        const response = await fetch('api.php?action=save_repair', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ticketData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur HTTP:', response.status, errorText);
            throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Stocker les données du ticket pour l'affichage
            currentTicket = {
                ...ticketData,
                numero_ticket: result.data.numero_ticket,
                date_creation: new Date().toLocaleString('fr-FR')
            };
            
            hideLoader();
            showNotification('Ticket enregistré avec succès !', 'success');
            
            // Afficher les actions finales
            showFinalActions();
            
        } else {
            throw new Error(result.message || 'Erreur lors de l\'enregistrement');
        }
        
    } catch (error) {
        hideLoader();
        console.error('Erreur complète:', error);
        console.error('Stack trace:', error.stack);
        
        // En cas d'erreur, créer un ticket local avec plus d'informations
        const ticketNumber = 'MRP' + Date.now().toString().slice(-6);
        
        currentTicket = {
            client: clientData,
            device: deviceData,
            repair: repairData,
            signature: canvas.toDataURL(),
            numero_ticket: ticketNumber,
            date_creation: new Date().toLocaleString('fr-FR'),
            error_info: error.message // Stocker l'erreur pour débogage
        };
        
        // Message d'erreur plus informatif
        let errorMessage = 'Connexion impossible. Ticket créé en local: ' + ticketNumber;
        if (error.message.includes('HTTP')) {
            errorMessage += '\nErreur serveur: ' + error.message;
        }
        
        showNotification(errorMessage, 'warning');
        
        // Afficher les actions finales
        showFinalActions();
    }
}

// Fonction pour afficher les actions finales
function showFinalActions() {
    // Masquer le formulaire et afficher les actions finales
    document.querySelector('.repair-form').style.display = 'none';
    document.querySelector('.progress-bar').style.display = 'none';
    
    const finalActions = document.getElementById('finalActions');
    finalActions.style.display = 'block';
    
    // Vérifier que currentTicket et numero_ticket existent avant de les utiliser
    if (currentTicket && currentTicket.numero_ticket) {
        document.getElementById('clientNumber').textContent = currentTicket.numero_ticket;
    } else {
        console.error('Erreur: currentTicket ou numero_ticket non défini', currentTicket);
        document.getElementById('clientNumber').textContent = 'Erreur - Numéro non disponible';
    }
    
    // Animation d'apparition
    finalActions.style.opacity = '0';
    finalActions.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        finalActions.style.transition = 'all 0.5s ease';
        finalActions.style.opacity = '1';
        finalActions.style.transform = 'translateY(0)';
    }, 100);
}

// Fonctions utilitaires pour l'API
function collectClientData() {
    const fullName = document.getElementById('clientName').value.trim();
    const nameParts = fullName.split(' ');
    const prenom = nameParts[0] || '';
    const nom = nameParts.slice(1).join(' ') || nameParts[0] || '';
    
    return {
        nom: nom,
        prenom: prenom,
        telephone: document.getElementById('clientPhone').value.trim(),
        email: document.getElementById('clientEmail').value.trim(),
        adresse: document.getElementById('clientAddress').value.trim()
    };
}

function collectDeviceData() {
    return {
        type_appareil: document.getElementById('deviceType').value,
        marque: document.getElementById('deviceBrand').value.trim(),
        modele: document.getElementById('deviceModel').value.trim(),
        couleur: document.getElementById('deviceColor').value.trim(),
        imei_serie: document.getElementById('imeiNumber').value.trim() || document.getElementById('serialNumber').value.trim(),
        etat_general: document.getElementById('deviceCondition').value,
        accessoires: Array.from(document.querySelectorAll('input[name="accessories"]:checked'))
                          .map(cb => cb.value).join(', ')
    };
}

function collectRepairData() {
    return {
        probleme_declare: document.getElementById('problemDescription').value.trim(),
        type_reparation: document.getElementById('repairType').value.trim(),
        urgence: document.getElementById('urgency').value,
        prix_estime: parseFloat(document.getElementById('estimatedPrice').value) || 0,
        duree_estimee: document.getElementById('estimatedDuration').value.trim(),
        notes_supplementaires: document.getElementById('additionalNotes').value.trim()
    };
}

function validateAllData(clientData, deviceData, repairData) {
    const errors = [];
    
    // Validation client
    if (!clientData.nom || !clientData.prenom) errors.push('Nom et prénom du client requis');
    if (!clientData.telephone) errors.push('Téléphone du client requis');
    
    // Validation appareil
    if (!deviceData.type_appareil) errors.push('Type d\'appareil requis');
    if (!deviceData.marque) errors.push('Marque de l\'appareil requise');
    if (!deviceData.modele) errors.push('Modèle de l\'appareil requis');
    
    // Validation réparation
    if (!repairData.probleme_declare) errors.push('Description du problème requise');
    if (!repairData.type_reparation) errors.push('Type de réparation requis');
    if (!repairData.prix_estime || repairData.prix_estime <= 0) errors.push('Prix estimé requis et doit être supérieur à 0');
    
    if (errors.length > 0) {
        showNotification('Erreurs de validation:\n' + errors.join('\n'), 'error');
        return false;
    }
    
    return true;
}

// Fonctions d'interface utilisateur
function showLoader(message = 'Chargement...') {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.remove();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Suppression automatique
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Fonction pour rechercher un ticket existant
async function searchTicket() {
    const numeroTicket = prompt('Entrez le numéro de ticket à rechercher:');
    if (!numeroTicket) return;
    
    showLoader('Recherche en cours...');
    
    try {
        const response = await fetch(`api.php?action=get_repair&numero_ticket=${encodeURIComponent(numeroTicket)}`);
        const result = await response.json();
        
        if (result.success) {
            // Remplir le formulaire avec les données trouvées
            fillFormWithTicketData(result.data);
            hideLoader();
            showNotification('Ticket trouvé et chargé !', 'success');
        } else {
            throw new Error(result.error || 'Ticket non trouvé');
        }
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur: ' + error.message, 'error');
    }
}

function fillFormWithTicketData(data) {
    // Remplir les données client
    document.getElementById('clientName').value = data.client_name || '';
    document.getElementById('clientPhone').value = data.client_phone || '';
    document.getElementById('clientEmail').value = data.client_email || '';
    document.getElementById('clientAddress').value = data.client_address || '';
    
    // Remplir les données appareil
    document.getElementById('deviceType').value = data.device_type || '';
    document.getElementById('deviceBrand').value = data.device_brand || '';
    document.getElementById('deviceModel').value = data.device_model || '';
    document.getElementById('imeiNumber').value = data.device_imei || '';
    document.getElementById('deviceColor').value = data.device_color || '';
    
    // Remplir les données réparation
    document.getElementById('problemDescription').value = data.repair_problem || '';
    document.getElementById('repairType').value = data.repair_type || '';
    document.getElementById('estimatedPrice').value = data.repair_price || '';
    document.getElementById('estimatedDuration').value = data.repair_duration || '';
    
    // Aller à la première section
    showSection(1);
}

// Test de connexion à la base de données
async function testDatabaseConnection() {
    try {
        const response = await fetch('api.php?action=test_connection');
        const result = await response.json();
        
        if (result.success) {
            showNotification('Connexion à la base de données réussie !', 'success');
            console.log('Serveur MySQL:', result.server_info);
        } else {
            showNotification('Échec de la connexion: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Erreur de connexion: ' + error.message, 'error');
    }
}

// Collecter toutes les données du formulaire
function collectFormData() {
    const formData = {
        client: {
            name: document.getElementById('clientName').value,
            phone: document.getElementById('clientPhone').value,
            email: document.getElementById('clientEmail').value,
            address: document.getElementById('clientAddress').value
        },
        device: {
            type: document.getElementById('deviceType').value,
            brand: document.getElementById('deviceBrand').value,
            model: document.getElementById('deviceModel').value,
            color: document.getElementById('deviceColor').value,
            imei: document.getElementById('imeiNumber').value,
            serial: document.getElementById('serialNumber').value,
            condition: document.getElementById('deviceCondition').value
        },
        repair: {
            problem: document.getElementById('problemDescription').value,
            type: document.getElementById('repairType').value,
            urgency: document.getElementById('urgency').value,
            price: document.getElementById('estimatedPrice').value,
            duration: document.getElementById('estimatedDuration').value,
            accessories: Array.from(document.querySelectorAll('input[name="accessories"]:checked')).map(cb => cb.value),
            notes: document.getElementById('additionalNotes').value
        },
        clientNumber: clientNumber,
        date: new Date().toLocaleDateString('fr-FR'),
        time: new Date().toLocaleTimeString('fr-FR')
    };
    
    return formData;
}

// Envoyer par email
function sendEmail() {
    const formData = collectFormData();
    const canvas = document.getElementById('signatureCanvas');
    const signatureDataURL = canvas.toDataURL();
    
    // Créer le contenu de l'email
    const emailContent = generateEmailContent(formData, signatureDataURL);
    
    // Dans un vrai projet, ici on enverrait l'email via un service backend
    // Pour la démo, on ouvre le client email par défaut
    const subject = encodeURIComponent(`Prise en charge ${clientNumber} - ${formData.client.name}`);
    const body = encodeURIComponent(emailContent);
    
    if (formData.client.email) {
        window.open(`mailto:${formData.client.email}?subject=${subject}&body=${body}`);
    } else {
        alert('Aucune adresse email renseignée pour le client.');
    }
    
    // Animation de confirmation
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Envoyé !';
    button.style.background = '#27ae60';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 3000);
}

// Générer le contenu de l'email
function generateEmailContent(data, signature) {
    return `
Bonjour ${data.client.name},

Voici le récapitulatif de votre prise en charge :

NUMÉRO DE DOSSIER : ${data.clientNumber}
DATE : ${data.date} à ${data.time}

=== INFORMATIONS CLIENT ===
Nom : ${data.client.name}
Téléphone : ${data.client.phone}
Email : ${data.client.email || 'Non renseigné'}
Adresse : ${data.client.address || 'Non renseignée'}

=== APPAREIL ===
Type : ${data.device.type}
Marque : ${data.device.brand}
Modèle : ${data.device.model}
Couleur : ${data.device.color || 'Non renseignée'}
IMEI/Série : ${data.device.imei}
État : ${data.device.condition || 'Non renseigné'}

=== RÉPARATION ===
Problème : ${data.repair.problem}
Type de réparation : ${data.repair.type}
Urgence : ${data.repair.urgency}
Prix estimé : ${data.repair.price}€
Durée estimée : ${data.repair.duration}
Accessoires : ${data.repair.accessories.join(', ') || 'Aucun'}
Notes : ${data.repair.notes || 'Aucune'}

Nous vous tiendrons informé de l'avancement de la réparation.

Cordialement,
L'équipe de réparation
    `;
}

// Imprimer l'étiquette
function printLabel() {
    const formData = collectFormData();
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    const labelContent = generateLabelContent(formData);
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Étiquette ${clientNumber}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px;
                    font-size: 12px;
                }
                .label {
                    width: 10cm;
                    height: 6cm;
                    border: 2px solid #000;
                    padding: 10px;
                    box-sizing: border-box;
                }
                .header {
                    text-align: center;
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #000;
                    padding-bottom: 5px;
                }
                .client-number {
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center;
                    margin: 10px 0;
                }
                .info-row {
                    margin: 5px 0;
                    display: flex;
                    justify-content: space-between;
                }
                .price {
                    font-size: 14px;
                    font-weight: bold;
                    text-align: center;
                    margin-top: 10px;
                    padding: 5px;
                    border: 1px solid #000;
                }
            </style>
        </head>
        <body>
            ${labelContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis imprimer
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
    
    // Animation de confirmation
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Imprimé !';
    button.style.background = '#27ae60';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 3000);
}

// Générer le contenu de l'étiquette
function generateLabelContent(data) {
    return `
        <div class="label">
            <div class="header">PRISE EN CHARGE</div>
            <div class="client-number">${clientNumber}</div>
            <div class="info-row">
                <span><strong>Client:</strong></span>
                <span>${data.client.name}</span>
            </div>
            <div class="info-row">
                <span><strong>Appareil:</strong></span>
                <span>${data.device.brand} ${data.device.model}</span>
            </div>
            <div class="info-row">
                <span><strong>IMEI:</strong></span>
                <span>${data.device.imei}</span>
            </div>
            <div class="info-row">
                <span><strong>Réparation:</strong></span>
                <span>${data.repair.type}</span>
            </div>
            <div class="info-row">
                <span><strong>Date:</strong></span>
                <span>${data.date}</span>
            </div>
            <div class="price">Prix: ${data.repair.price}€</div>
        </div>
    `;
}

// Nouvelle prise en charge
function newTicket() {
    if (confirm('Êtes-vous sûr de vouloir créer une nouvelle prise en charge ? Les données actuelles seront perdues.')) {
        // Réinitialiser le formulaire
        document.getElementById('repairForm').reset();
        
        // Effacer la signature
        clearSignature();
        
        // Générer un nouveau numéro client
        generateClientNumber();
        
        // Retourner à la première section
        showSection(1);
        
        // Réafficher le formulaire
        document.querySelector('.repair-form').style.display = 'block';
        document.querySelector('.progress-bar').style.display = 'flex';
        document.getElementById('finalActions').style.display = 'none';
        
        // Réinitialiser les styles de validation
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.style.borderColor = '';
        });
    }
}

// Gestion du redimensionnement pour le responsive
window.addEventListener('resize', function() {
    const canvas = document.getElementById('signatureCanvas');
    if (window.innerWidth <= 768) {
        canvas.width = Math.min(350, window.innerWidth - 80);
        canvas.height = 150;
    } else {
        canvas.width = 400;
        canvas.height = 200;
    }
    
    // Réinitialiser le contexte après redimensionnement
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
});

// Gestion des raccourcis clavier
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter pour passer à la section suivante
    if (e.ctrlKey && e.key === 'Enter') {
        if (currentSection < 3) {
            nextSection(currentSection + 1);
        } else {
            generateTicket();
        }
    }
    
    // Échap pour revenir à la section précédente
    if (e.key === 'Escape' && currentSection > 1) {
        previousSection(currentSection - 1);
    }
});

// Auto-sauvegarde locale (optionnel)
function autoSave() {
    const formData = collectFormData();
    localStorage.setItem('repairFormData', JSON.stringify(formData));
}

// Charger les données sauvegardées
function loadSavedData() {
    const savedData = localStorage.getItem('repairFormData');
    if (savedData) {
        const data = JSON.parse(savedData);
        // Remplir les champs avec les données sauvegardées
        // (implémentation selon les besoins)
    }
}

// Sauvegarde automatique toutes les 30 secondes
setInterval(autoSave, 30000);

// ========================================
// FONCTIONS POUR LA GESTION DES PC
// ========================================

// Variables globales pour la gestion des PC
let pcList = [];
let filteredPCList = [];

// Afficher la modal de liste des PC
function showPCList() {
    document.getElementById('pcListModal').style.display = 'block';
    loadPCList();
}

// Fermer la modal de liste des PC
function closePCListModal() {
    document.getElementById('pcListModal').style.display = 'none';
}

// Afficher la modal de nouveau PC
function showNewPCForm() {
    document.getElementById('newPCModal').style.display = 'block';
    // Réinitialiser le formulaire
    document.getElementById('newPCForm').reset();
}

// Fermer la modal de nouveau PC
function closeNewPCModal() {
    document.getElementById('newPCModal').style.display = 'none';
}

// Charger la liste des PC depuis l'API
async function loadPCList() {
    const container = document.getElementById('pcListContainer');
    container.innerHTML = '<div class="loading">Chargement des PC...</div>';
    
    try {
        const response = await fetch('api.php?action=getPCList');
        
        // Vérifier si la réponse est OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Obtenir le texte brut de la réponse
        const responseText = await response.text();
        
        // Essayer de parser le JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Erreur de parsing JSON:', jsonError);
            console.error('Réponse reçue:', responseText);
            throw new Error(`Erreur lors du chargement: ${jsonError.message}`);
        }
        
        if (data.success) {
            pcList = data.data || [];
            filteredPCList = [...pcList];
            displayPCList();
        } else {
            container.innerHTML = `<div class="error">Erreur: ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        container.innerHTML = `<div class="error">Erreur lors du chargement: ${error.message}</div>`;
    }
}

// Afficher la liste des PC
function displayPCList() {
    const container = document.getElementById('pcListContainer');
    
    if (filteredPCList.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                Aucun PC trouvé
            </div>
        `;
        return;
    }
    
    let html = '';
    filteredPCList.forEach(pc => {
        const statusClass = pc.status === 'terminé' ? 'termine' : 'en-cours';
        const statusText = pc.status === 'terminé' ? 'Terminé' : 'En cours';
        
        html += `
            <div class="pc-item" onclick="selectPC(${pc.id})">
                <div class="pc-ticket-badge">${pc.ticket_number || 'N/A'}</div>
                <div class="pc-item-header">
                    <div class="pc-client-name">${pc.client_name}</div>
                    <div class="pc-status ${statusClass}">${statusText}</div>
                </div>
                <div class="pc-item-details">
                    <div class="pc-detail">
                        <i class="fas fa-phone"></i>
                        <span>${pc.client_phone}</span>
                    </div>
                    <div class="pc-detail">
                        <i class="fas fa-laptop"></i>
                        <span>${pc.device_type} ${pc.device_brand} ${pc.device_model}</span>
                    </div>
                    ${pc.imei ? `
                    <div class="pc-detail">
                        <i class="fas fa-barcode"></i>
                        <span>IMEI: ${pc.imei}</span>
                    </div>
                    ` : ''}
                    <div class="pc-detail">
                        <i class="fas fa-calendar"></i>
                        <span>Créé le ${formatDate(pc.created_at)}</span>
                    </div>
                    <div class="pc-detail">
                        <i class="fas fa-wrench"></i>
                        <span>${pc.problem_description}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    updatePCStats();
}

// Mettre à jour les statistiques de la liste PC
function updatePCStats() {
    const pcCount = document.getElementById('pcCount');
    const statusBreakdown = document.getElementById('statusBreakdown');
    
    const total = filteredPCList.length;
    const enCours = filteredPCList.filter(pc => pc.status !== 'terminé').length;
    const termine = filteredPCList.filter(pc => pc.status === 'terminé').length;
    
    pcCount.textContent = `${total} PC${total > 1 ? 's' : ''}`;
    statusBreakdown.innerHTML = `
        <span style="color: #856404;">${enCours} en cours</span> • 
        <span style="color: #155724;">${termine} terminé${termine > 1 ? 's' : ''}</span>
    `;
}

// Filtrer la liste des PC
function filterPCList() {
    const searchTerm = document.getElementById('searchPC').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    filteredPCList = pcList.filter(pc => {
        const matchesSearch = pc.client_name.toLowerCase().includes(searchTerm) ||
               pc.client_phone.includes(searchTerm) ||
               (pc.imei && pc.imei.toLowerCase().includes(searchTerm)) ||
               pc.problem_description.toLowerCase().includes(searchTerm) ||
               (pc.ticket_number && pc.ticket_number.toLowerCase().includes(searchTerm));
               
        const matchesStatus = !statusFilter || pc.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    displayPCList();
}

// Trier la liste des PC
function sortPCList() {
    const sortBy = document.getElementById('sortBy').value;
    
    filteredPCList.sort((a, b) => {
        switch (sortBy) {
            case 'created_at_desc':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'created_at_asc':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'client_name_asc':
                return a.client_name.localeCompare(b.client_name);
            case 'client_name_desc':
                return b.client_name.localeCompare(a.client_name);
            default:
                return 0;
        }
    });
    
    displayPCList();
}

// Sélectionner un PC (pour édition future)
function selectPC(pcId) {
    console.log('PC sélectionné:', pcId);
    // Ici on pourrait ouvrir une modal d'édition
    // Pour l'instant, on ferme juste la modal
    closePCListModal();
    alert(`PC #${pcId} sélectionné. Fonctionnalité d'édition à venir.`);
}

// Gérer la soumission du formulaire nouveau PC
document.addEventListener('DOMContentLoaded', function() {
    const newPCForm = document.getElementById('newPCForm');
    if (newPCForm) {
        newPCForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveNewPC();
        });
    }
});

// Sauvegarder un nouveau PC
async function saveNewPC() {
    const formData = {
        client_name: document.getElementById('newClientName').value,
        client_phone: document.getElementById('newClientPhone').value,
        device_type: document.getElementById('newDeviceType').value,
        device_brand: document.getElementById('newDeviceBrand').value,
        device_model: document.getElementById('newDeviceModel').value,
        imei: document.getElementById('newIMEI').value || null,
        problem_description: document.getElementById('newProblem').value
    };
    
    try {
        const response = await fetch('api.php?action=addPC', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('PC ajouté avec succès !');
            closeNewPCModal();
            // Recharger la liste si elle est ouverte
            if (document.getElementById('pcListModal').style.display === 'block') {
                loadPCList();
            }
        } else {
            alert(`Erreur: ${data.message}`);
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur de connexion à la base de données');
    }
}

// Formater une date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fermer les modals en cliquant à l'extérieur
window.addEventListener('click', function(event) {
    const pcListModal = document.getElementById('pcListModal');
    const newPCModal = document.getElementById('newPCModal');
    
    if (event.target === pcListModal) {
        closePCListModal();
    }
    
    if (event.target === newPCModal) {
        closeNewPCModal();
    }
});