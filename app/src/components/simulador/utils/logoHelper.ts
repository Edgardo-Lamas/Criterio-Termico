// Helper to load logo as base64 for PDF generation
export const loadLogoAsBase64 = async (logoPath: string): Promise<string | null> => {
    // Skip if path is empty or invalid
    if (!logoPath || logoPath.trim() === '') {
        return null;
    }

    // Create a timeout promise to prevent hanging
    const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
            resolve(null);
        }, 3000);
    });

    const loadPromise = (async (): Promise<string | null> => {
        try {
            const response = await fetch(logoPath);

            // Check if response is OK and is actually an image
            if (!response.ok) {
                return null;
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                return null;
            }

            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            return null;
        }
    })();

    // Race between timeout and actual loading
    return Promise.race([loadPromise, timeoutPromise]);
};
