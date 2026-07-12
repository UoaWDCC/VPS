import {
  ArrowLeftIcon,
  ArrowLeftToLineIcon,
  ArrowRightIcon,
  ArrowRightToLineIcon,
} from "lucide-react";

export default function TablePaginationActions(props) {
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <div className="flex gap-0.5">
      <button
        className="btn btn-xs"
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        <ArrowLeftToLineIcon size={16} />
      </button>
      <button
        className="btn btn-xs"
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        <ArrowLeftIcon size={16} />
      </button>
      <button
        className="btn btn-xs"
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        <ArrowRightIcon size={16} />
      </button>
      <button
        className="btn btn-xs"
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        <ArrowRightToLineIcon size={16} />
      </button>
    </div>
  );
}
