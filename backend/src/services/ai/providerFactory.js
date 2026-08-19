const geminiProvider = require('./providers/geminiProvider');
const groqProvider = require('./providers/groqProvider');

const providerRegistry = new Map();

const registerProvider = (provider) => {
  if (!provider.name || typeof provider.generateResponse !== 'function') {
    throw new Error(`Invalid provider: ${provider.name || 'unnamed'}`);
  }
  providerRegistry.set(provider.name, provider);
};

registerProvider(geminiProvider);
registerProvider(groqProvider);

const getActiveProvider = () => {
  const preferredOrder = ['gemini', 'groq'];

  for (const name of preferredOrder) {
    const provider = providerRegistry.get(name);
    if (!provider) continue;

    const apiKey = process.env[`${name.toUpperCase()}_API_KEY`];
    if (apiKey) return { provider, name };
  }

  for (const [name, provider] of providerRegistry) {
    const apiKey = process.env[`${name.toUpperCase()}_API_KEY`];
    if (apiKey) return { provider, name };
  }

  return null;
};

const getAvailableProviders = () => {
  const available = [];
  for (const [name, provider] of providerRegistry) {
    const apiKey = process.env[`${name.toUpperCase()}_API_KEY`];
    if (apiKey) {
      available.push({ name, provider });
    }
  }
  return available;
};

const generateWithFallback = async (message, chatId = null, userId = null) => {
  const active = getActiveProvider();
  if (!active) {
    return {
      success: false,
      error: 'No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY in .env',
      confidence: 0,
      needsTicket: true,
      provider: 'none'
    };
  }

  const startTime = Date.now();

  try {
    const result = await active.provider.generateResponse(message, chatId, userId);
    result.provider = active.name;

    if (result.success !== false) {
      return result;
    }

    console.log(`[ProviderFactory] Primary ${active.name} returned unsuccessful:`, result.error || 'no error');

    const fallbacks = getAvailableProviders().filter(p => p.name !== active.name);
    for (const fallback of fallbacks) {
      try {
        console.log(`[ProviderFactory] Trying fallback: ${fallback.name}`);
        const fbResult = await fallback.provider.generateResponse(message, chatId, userId);
        if (fbResult.success !== false) {
          fbResult.provider = fallback.name;
          fbResult.fromFallback = true;
          return fbResult;
        }
        console.log(`[ProviderFactory] Fallback ${fallback.name} also unsuccessful:`, fbResult.error || 'no error');
      } catch (fallbackError) {
        console.error(`[ProviderFactory] Fallback ${fallback.name} failed:`, fallbackError.message);
      }
    }

    return result;
  } catch (primaryError) {
    console.error(`[ProviderFactory] Primary provider ${active.name} failed:`, primaryError.message);

    const fallbacks = getAvailableProviders().filter(p => p.name !== active.name);
    for (const fallback of fallbacks) {
      try {
        console.log(`[ProviderFactory] Trying fallback: ${fallback.name}`);
        const fbResult = await fallback.provider.generateResponse(message, chatId, userId);
        if (fbResult.success !== false) {
          fbResult.provider = fallback.name;
          fbResult.fromFallback = true;
          return fbResult;
        }
      } catch (fallbackError) {
        console.error(`[ProviderFactory] Fallback ${fallback.name} failed:`, fallbackError.message);
      }
    }

    return {
      success: false,
      error: 'All AI providers failed. A support ticket has been created.',
      confidence: 0,
      needsTicket: true,
      provider: 'none'
    };
  }
};

module.exports = {
  getActiveProvider,
  getAvailableProviders,
  generateWithFallback,
  registerProvider
};
