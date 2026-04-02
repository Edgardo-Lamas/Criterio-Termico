// Helper to load logo as base64 for PDF generation
export const loadLogoAsBase64 = async (logoPath: string): Promise<string | null> => {
    // Skip if path is empty or invalid
    if (!logoPath || logoPath.trim() === '') {
        console.log('Logo path is empty, skipping logo loading');
        return null;
    }

    // Create a timeout promise to prevent hanging
    const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
            console.warn('Logo loading timed out after 3 seconds');
            resolve(null);
        }, 3000);
    });

    const loadPromise = (async (): Promise<string | null> => {
        try {
            const response = await fetch(logoPath);

            // Check if response is OK and is actually an image
            if (!response.ok) {
                console.warn(`Logo fetch failed with status: ${response.status}`);
                return null;
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                console.warn(`Logo path returned non-image content-type: ${contentType}`);
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
            console.error('Error loading logo:', error);
            return null;
        }
    })();

    // Race between timeout and actual loading
    return Promise.race([loadPromise, timeoutPromise]);
};
