import { useReactTable, getCoreRowModel, flexRender, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGet } from "hooks/crudHooks";
import { useAuthDelete } from '../../../../hooks/crudHooks';
import axios from 'axios';

/**
 * Tanstack table code adapted from previous course work 
 * Accessed: 18/10/2025
 * URL: https://github.com/jackdar/speed-app/blob/main/frontend/src/components/article-table.tsx
 * - Bradley
 */

const AccessTable = () => {
//    const [users, setUsers] = useState();
    const [accessList, setAccessList] = useState(null);
   const { scenarioId } = useParams();
   const [data, setData] = useState([])
    // useGet(`api/user/`, setUsers);
    
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

    const handleSearchChange = (e) => {
        const v = e.target.value || "";
        // console.log(v)
        table.setGlobalFilter(v);
    }

    return(
        <>
        <div className="overflow-x-auto rounded-box border border-base-content/15 w-full">
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
        <span className='flex items-center'>
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
                <input list="userList" type="text" className="py-2 w-[200px]" ref={accessInputRef} placeholder='Add user'/>
               <datalist id="userList">
                <option value="test">test</option>
               </datalist>
            </label>
            <button className="btn bg-(--color-base-100) hover:cursor-pointer hover:bg-(--color-primary) border-(--color-base-content) ml-5">Add</button>
        </span>
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