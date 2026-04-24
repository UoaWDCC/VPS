import useEditorStore from "../stores/editor.ts";

function LoadingOverlay() {
  const loading = useEditorStore((state) => state.loading);

  if (!loading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* Blur background */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />

      {/* Spinner */}
      <div className="relative z-10">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

export default LoadingOverlay;
