import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

const CustomSortHeader = ({active, direction, onClick, children}) => {
    return (
        <th>
            <span 
                onClick={onClick}
                className="hover:cursor-pointer hover:text-base-content inline-flex items-center group"
            >
                <span>{children}</span>
                <span className={`inline-block origin-center duration-150 transform transition-transform ${active && direction == "desc" ? "rotate-180" : "rotate-0"} ${active ? "opacity-100" : "opacity-0 group-hover:opacity-30"}`}>
                <ArrowUpwardIcon fontSize="small" style={{transformOrigin: "center", display: "block"}}/>
                </span>
            </span>
        </th>
    )
}

export default CustomSortHeader;