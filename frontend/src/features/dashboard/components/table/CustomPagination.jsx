const CustomPagination = ({colSpan, value, onChange, count, page, rowsPerPage, onPageChange, actionComponent}) => {

    const actionNode = (() => {
    if (actionComponent) {
      const Comp = actionComponent;
      return <Comp count={count} page={page} rowsPerPage={rowsPerPage} onPageChange={onPageChange} />;
    }
    return null;
  })();

    return(
        <tr>
            <td colSpan={colSpan}>
            <div className="flex items-center justify-end">
                {/* row per page */}
                <div>
                <span>Rows per page: </span>
                <select value={value} onChange={onChange} className="select select-xs w-[40%]">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={count}>All</option>
                </select>
                </div>
                {/* No. of items */}
                <div className="pl-6">
                {rowsPerPage * page + 1} - {Math.max(Math.min(rowsPerPage, count), rowsPerPage * page + 1 + Math.ceil(count/rowsPerPage))} of {count}
                </div>
            {/* Pagination Buttons */}
            <div className="pl-2">
                {actionNode}
            </div>
            </div>
            </td>
        </tr>
    )
}

export default CustomPagination;