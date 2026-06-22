import './commands';

// Подавляем необработанные исключения из single-spa (они ожидаемы при тестировании)
Cypress.on('uncaught:exception', (err) => {
  // single-spa может кидать ошибки при монтировании/размонтировании в тестах — игнорируем
  if (err.message.includes('single-spa')) {
    return false;
  }
  // Ошибки загрузки модулей (import map) тоже игнорируем в тестах
  if (err.message.includes('Failed to fetch') || err.message.includes('Loading')) {
    return false;
  }
  return true;
});