export const simplifyText = async (text: string): Promise<string> => {
    try {
      const response = await fetch('https://language.googleapis.com/v1/documents:analyzeEntities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `AIzaSyBMrbfHkSND7MOCo0ML1GifyppVLZAC70o`,
        },
        body: JSON.stringify({ document: { content: text, type: 'PLAIN_TEXT' } }),
      });
  
      const data = await response.json();
      return data.entities.map((entity: any) => entity.name).join(', ');
    } catch (error) {
      console.error('Simplification Error:', error);
      return text;
    }
  };
  