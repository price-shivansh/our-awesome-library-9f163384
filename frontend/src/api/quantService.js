const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return '';
  return url.replace(/\/$/, '');
};
const API_BASE_URL = getApiBaseUrl();

export const analyzeSymbol = async (symbol) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quant/analyze?symbol=${encodeURIComponent(symbol)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch quant analysis');
    }
    return await response.json();
  } catch (error) {
    console.error('Error analyzing symbol:', error);
    throw error;
  }
};

export const analyzeSymbolV3 = async (symbol) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quant/v3?symbol=${encodeURIComponent(symbol)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch v3 quant analysis');
    }
    return await response.json();
  } catch (error) {
    console.error('Error analyzing symbol v3:', error);
    throw error;
  }
};
