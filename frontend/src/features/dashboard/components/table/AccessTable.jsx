import { useReactTable, getCoreRowModel, flexRender, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useState, useMemo, useRef, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useGet } from "hooks/crudHooks";
import { useAuthDelete, useDelete, usePost } from '../../../../hooks/crudHooks';
import axios from 'axios';
import Select, { components } from "react-select"


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

const AccessTable = ({token, ownerUid}) => {
   const [users, setUsers] = useState();
    const [accessList, setAccessList] = useState(null);
   const { scenarioId } = useParams();
   const [options, setOptions] = useState([]);
   const [data, setData] = useState([])
    const [selectedUserIndex, setSelectedUserIndex] = useState();
    // const {isLoading: listLoading, reFetch: accessReFetch} = useGet(`api/access/${scenarioId}/users`, setAccessList, true);

    const [listLoading, setListLoading] = useState(false);
    const fetchAccessList = async() => {
        setListLoading(true);
        try{
            const res = await axios.get(`/api/access/${scenarioId}/users`, {
                headers:{
                    Authorization: `Bearer ${token}`
                }
            });
            if(res.status == 200) {
                if(res.data.status === 404){
                    setAccessList(null);
                    return;
                } 
                setAccessList(res.data);
                

            }
         }catch(err) {
                console.log(err.message)
        } finally {
            setListLoading(false);
        }
    }
    useEffect(() =>{
        fetchAccessList()
    }, [scenarioId, token])
    // need some kind of check to only fetch if there is access list
    const {isLoading: userListLoading, reFetch: userReFetch} = useGet(`api/user/min`, setUsers); 

    const [accessSet, setAccessSet] = useState();
useEffect(() => {

    if(listLoading || accessList == null) return;

    let rows = [];
    let tempSet = new Set();
    Object.entries(accessList.users).forEach(([uid, info]) => {
        // console.log(uid)
        rows.push({
            uid: uid,
            name: info.name,
            email: info.email,
            date: info.addedAt
        })
        tempSet.add(uid);
    })
    setData(rows)
    setAccessSet(tempSet);
    // console.log(tempSet);
},[accessList, listLoading])


useEffect(() => {
 if(userListLoading || !users) return;

    let rows = [];
    users.forEach((user) => {
        if(accessSet && !accessSet.has(user.uid) || !user.uid == ownerUid){
            rows.push({
                value: user.uid,
                name: user.name,
                email: user.email,
            })
        };
    })
    setOptions(rows);    
}, [users, userListLoading])
const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const searchInputRef = useRef(null);
// console.log(accessSet)
     const handleDelete = async (uid) => {
        try{
            const result = await axios.delete(`/api/access/${scenarioId}/users/${uid}`,{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            })
            console.log(result)
            if(result.status != 200) return;
            setData((prev) => prev.filter((r) => r.uid !== uid));
            await fetchAccessList();
        } catch(err) {
            console.error(err.message)
        }
      };

      const createAccessList = async() => {
        // console.log("Create button pressed")
        try{
            // console.log(token)
            const result = await axios.post(`/api/access/${scenarioId}/create`,{},{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            });
            // console.log(result.data)
            if(result.status == 201){
                setAccessList(result.data);
                userReFetch();
            }
        } catch(err){
            console.log(err.message)
        }
      }

      const deleteAccessList = async() => {
        try{
            const result = await axios.delete(`/api/access/${scenarioId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if(result.status == 200){
setAccessList(null);
setAccessSet(null)
setData([])
return;
            } 
            console.log(result);
        } catch(err) {
            console.log(err.message)
        }
      }
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

    const handleChange = (e) => {
        // console.log(e.target.value)
        setSelectedUserIndex(e.target.value);
    }

    async function handleGrantAccess(){
        if(selectedUserIndex == -1) return;

        try{
            const uid = options[selectedUserIndex].value;
            const result = await axios.put(`/api/access/${scenarioId}/users/${uid}`,{},{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            });
            if(result.status == 200){
                await fetchAccessList();
                userReFetch();
            }
        } catch(err) {
            console.log(err.message);
        }
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

        {accessList != null ? (
            <span className='flex'>
                {/* <input type="select" list="test" onChange={handleChange}/> */}
                <select name="selectUser" id="selectUser" className='select' onChange={handleChange}>
                    <option value="-1" name="" email="">- Select user -</option>
                    {/* This option thing is prob wrong idk lol */}
                    {options.map((option, index) => {
                        return(<option value={index} label={option.name} key={option.value}>{option.name}</option>)
                    })}
                </select>
                <button className='btn' onClick={() => {handleGrantAccess()}}>Add</button>
                <button className='btn' onClick={() => {deleteAccessList()}}>Delete List</button>
            </span>

        ) : (
            <button className='btn' onClick={() => {createAccessList()}}>Create access List</button>
        )}
     
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