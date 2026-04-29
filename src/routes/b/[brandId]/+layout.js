/**
 * Brand Layout Load Function
 * ===========================
 * Extracts brandId from URL params and passes it to the layout and all child pages.
 */
/** @type {import('./$types').LayoutLoad} */
export const load = ({ params }) => {
    return {
        brandId: params.brandId
    };
};
