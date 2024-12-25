import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { SecurityService } from '../../infrastructure/security/SecurityService';
import { SyncService } from '../../infrastructure/sync/SyncService';
import { GlossaryRepository } from '../../data/repositories/GlossaryRepository';

describe('Glossary Extension E2E Tests', () => {
  let driver: WebDriver;
  let glossaryRepository: GlossaryRepository;
  let securityService: SecurityService;
  let syncService: SyncService;

  beforeAll(async () => {
    // Initialiser le driver Selenium
    driver = await new Builder()
      .forBrowser('chrome')
      .build();

    // Initialiser les services
    glossaryRepository = new GlossaryRepository();
    securityService = new SecurityService();
    syncService = new SyncService('https://api.example.com', securityService);
  });

  afterAll(async () => {
    await driver.quit();
  });

  beforeEach(async () => {
    // Nettoyer la base de données de test
    await glossaryRepository.clear();
    
    // Réinitialiser l'état de l'extension
    await driver.executeScript(`
      chrome.storage.local.clear();
      chrome.storage.sync.clear();
    `);
  });

  describe('Basic Functionality', () => {
    it('should highlight terms on webpage', async () => {
      // Ajouter un terme au glossaire
      await glossaryRepository.saveEntry({
        term: 'test term',
        definition: 'test definition',
        category: 'test'
      });

      // Charger une page de test
      await driver.get('http://localhost:8080/test.html');

      // Attendre que l'extension traite la page
      await driver.sleep(1000);

      // Vérifier que le terme est surligné
      const highlightedElements = await driver.findElements(By.className('glossary-highlight'));
      expect(highlightedElements.length).toBeGreaterThan(0);
    });

    it('should show definition popup on hover', async () => {
      // Ajouter un terme au glossaire
      const testEntry = {
        term: 'hover test',
        definition: 'hover definition',
        category: 'test'
      };
      await glossaryRepository.saveEntry(testEntry);

      // Charger la page de test
      await driver.get('http://localhost:8080/test.html');

      // Attendre le traitement de la page
      await driver.sleep(1000);

      // Survoler un terme surligné
      const highlightedElement = await driver.findElement(By.className('glossary-highlight'));
      const actions = driver.actions();
      await actions.move({ origin: highlightedElement }).perform();

      // Vérifier que la popup apparaît
      const popup = await driver.wait(until.elementLocated(By.className('glossary-popup')), 2000);
      const popupText = await popup.getText();
      expect(popupText).toContain(testEntry.definition);
    });
  });

  describe('Security Features', () => {
    it('should safely handle malicious content', async () => {
      // Tenter d'ajouter une entrée malveillante
      const maliciousEntry = {
        term: 'xss test',
        definition: '<script>alert("xss")</script>',
        category: 'test'
      };

      // L'entrée devrait être assainie
      await glossaryRepository.saveEntry(maliciousEntry);
      
      // Charger la page de test
      await driver.get('http://localhost:8080/test.html');
      
      // Vérifier que le contenu malveillant est assaini
      const popup = await driver.findElement(By.className('glossary-popup'));
      const popupHtml = await popup.getAttribute('innerHTML');
      expect(popupHtml).not.toContain('<script>');
    });
  });

  describe('Sync Functionality', () => {
    it('should sync changes with server', async () => {
      // Ajouter une entrée locale
      const testEntry = {
        term: 'sync test',
        definition: 'sync definition',
        category: 'test'
      };
      await glossaryRepository.saveEntry(testEntry);

      // Déclencher la synchronisation
      await syncService.sync();

      // Vérifier que les changements sont synchronisés
      const entries = await glossaryRepository.getAllEntries();
      expect(entries).toContainEqual(expect.objectContaining(testEntry));
    });
  });

  describe('Performance', () => {
    it('should handle large documents efficiently', async () => {
      // Ajouter de nombreuses entrées
      const entries = Array.from({ length: 100 }, (_, i) => ({
        term: `term${i}`,
        definition: `definition${i}`,
        category: 'test'
      }));
      
      await Promise.all(entries.map(entry => glossaryRepository.saveEntry(entry)));

      // Mesurer le temps de traitement
      const startTime = Date.now();
      
      await driver.get('http://localhost:8080/large-test.html');
      await driver.sleep(1000);

      const processingTime = Date.now() - startTime;
      
      // Le traitement devrait prendre moins de 5 secondes
      expect(processingTime).toBeLessThan(5000);
    });
  });
});
