const GradientLine = () => {
  return (
    <div className="flex items-center justify-center w-[2px] relative">
      <div 
        className="w-[1px] h-screen"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, #ffffff 50%, transparent 100%)'
        }}
      />
    </div>
  );
};

export default GradientLine;
