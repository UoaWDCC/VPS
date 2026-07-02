function LoadingPage({ text }) {
  return (
    <div className="flex flex-col gap-4 items-center h-screen justify-center">
      <span className="loading loading-ring loading-xl"></span>
      <p className="text-s">{text}</p>
    </div>
  );
}

export default LoadingPage;
