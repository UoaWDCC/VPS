/**
 * Component displaying groups in a table format
 *
 * @component
 * @example
 * return (
 *   <GroupsTable data={csv_data}>
 *   </GroupsTable>
 * )
 */

export default function GroupsTable({
  data = [
    { groupNumber: 1, nurse: "Alice", doctor: "Bob", pharmacist: "Charlie" },
    { groupNumber: 2, nurse: "David", doctor: "Eve", pharmacist: "Frank" },
    { groupNumber: 3, nurse: "Grace", doctor: "Henry", pharmacist: "Ivy" },
    { groupNumber: 4, nurse: "Jack", doctor: "Kelly", pharmacist: "Liam" },
  ],
}) {
  return (
    <div className="relative overflow-x-auto justify-center">
      <h1 className="text-2xl font-bold mb-4 text-center">Group Table</h1>
      <table>
        <thead>
          <tr>
            <th>Group Number</th>
            <th>Nurse</th>
            <th>Doctor</th>
            <th>Pharmacist</th>
          </tr>
        </thead>
        <tbody>
          {data.map((group) => (
            <tr key={group.groupNumber}>
              <td>{group.groupNumber}</td>
              <td>{group.nurse}</td>
              <td>{group.doctor}</td>
              <td>{group.pharmacist}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
