import { useReactTable, getCoreRowModel, flexRender, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGet } from "hooks/crudHooks";
import { useAuthDelete } from '../../../../hooks/crudHooks';
import axios from 'axios';
import Select from "react-select"

/**
 * Tanstack table code adapted from previous course work 
 * Accessed: 18/10/2025
 * URL: https://github.com/jackdar/speed-app/blob/main/frontend/src/components/article-table.tsx
 * - Bradley
 */


const CustomOption = (opt) => {
    return(
        <div className='flex flex-col text-black'>
            <span className='font-semibold'>{opt.name}</span>
            {/* <span className='text-[12px] text-black'>{opt.email}</span> */}
        </div>
    )
}

const AccessTable = () => {
   const [users, setUsers] = useState();
    const [accessList, setAccessList] = useState(null);
   const { scenarioId } = useParams();
   const [options, setOptions] = useState();
   const [data, setData] = useState([])
    const [selectedUser, setSelectedUser] = useState();
    const [inputValue, setInputValue] = useState();
   const {isLoading: userListLoading} = useGet(`api/user/min`, setUsers); 
    const {isLoading: listLoading, reFetch: accessReFetch} = useGet(`api/access/${scenarioId}/users`, setAccessList, true);

useEffect(() => {
    if(listLoading || !accessList) return;

    let rows = [];
    Object.entries(accessList.users).forEach(([uid, info]) => {
        // console.log(uid)
        rows.push({
            uid: uid,
            name: info.name,
            email: info.email,
            date: info.addedAt
        })
    })
    setData(rows)
},[accessList, listLoading])


useEffect(() => {
 if(userListLoading || !users) return;

    let rows = [];
    users.forEach((user) => {
        rows.push({
            value: user.uid,
            name: user.name,
            email: user.email,
        })
    })
    setOptions(rows);
    console.log(users);
    
}, [users, userListLoading])
const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const searchInputRef = useRef(null);
    const accessInputRef = useRef(null);
    const authDelete = useAuthDelete;
     const handleDelete = async (uid) => {
        try{
            const result = await axios.delete(`/api/access/${scenarioId}/users/${uid}`)
            console.log(result)
            setData((prev) => prev.filter((r) => r.uid !== uid));
            accessReFetch();
        } catch(err) {
            console.error(err.message)
        }
      };
    const columns = useMemo(()=>[
        {header: "name", accessorKey:"name"},
        {header:"Email", accessorKey:"email"},
        {header:"Date Added", accessorKey:"date"},
        {id:"action", header: "", cell: ({ row }) => {
      const item = row.original;
     
      
      return (
        <button
          onClick={() => handleDelete(item.uid)}
          aria-label={`Delete ${item.name}`}
          className="btn btn-ghost btn-sm"
        >
          <DeleteForeverIcon fontSize="small" />
        </button>
      );
    },
    }
    ])
const table = useReactTable({ 
    data, 
    columns, 
  state:{sorting, globalFilter},
  onSortingChange: setSorting,
  onGlobalFilterChange: setGlobalFilter,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),

})
console.log(selectedUser)
    const handleSearchChange = (e) => {
        const v = e.target.value || "";
        // console.log(v)
        table.setGlobalFilter(v);
    }

    return(
        <>
        <div className=" rounded-box border border-base-content/15 w-full">
        <div className='flex justify-between'>
        <label className="input input-lg focus-within:outline-0">
            <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
                >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
                </g>
            </svg>
            <input type="search" className="w-[250px] py-2" ref={searchInputRef} placeholder='Search table' onChange={handleSearchChange}/>
        </label>
        <Select 
            placeholder="Add user"
            options={options} 
            className='w-[300px] text-black'
            getOptionLabel={(opt) => opt.name}
            getOptionValue={(opt) => opt.value}
            isSearchable={true}
            filterOption={(option, inputValue) => {
                const oData = option.data;
                const query = (inputValue || "");
                return(
                    String(oData.name || "").toLowerCase().includes(query) ||
                    String(oData.email || "").toLowerCase().includes(query)
                )
            }}
            onChange={(val, {action}) => {
                if(action == "input-change" && inputValue && inputValue.length > 0) {
                    setSelectedUser(val);
                }
                return null;
            }}
        />
      
        </div>
        <table className="table table-zebra">
        <thead>
        {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
            {hg.headers.map((header) => (
                <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
            ))}
            </tr>
        ))}
        </thead>
        <tbody>
        {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
            ))}
            </tr>
        ))}
        {table.getRowModel().rows.length == 0 && (
            <tr>
                <td colSpan={columns.length} className='text-center'>No Results</td>
            </tr>
        )}
        </tbody>
    </table>
    </div>
        </>
    )
}

export default AccessTable;