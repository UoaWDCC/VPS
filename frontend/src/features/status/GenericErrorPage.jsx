const GenericErrorPage = () => {
  return (
    <div className="flex flex-col gap-4 items-center h-screen justify-center">
      <h1 className="text-xl">{"Something went wrong :\\"}</h1>
      <p className="text-s">
        Some unexpected error occurred while trying to play the scenario. Please
        try again later.
      </p>
    </div>
  );
};

export default GenericErrorPage;
