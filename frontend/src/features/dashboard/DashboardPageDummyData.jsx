// import styles from "./DashboardScoreboard.module.scss";
// import userIcon from "./test_icon.png";

// const students = [
//   {
//     image: "placeholder",
//     id: 1,
//     name: "John",
//     totalScore: 43,
//     playTime: 23,
//     lastPlayed: "September 20 2020",
//     completed: true,
//   },
//   {
//     image: "placeholder",
//     id: 2,
//     name: "Ahmed",
//     totalScore: 100,
//     playTime: 2,
//     lastPlayed: "July 2 2020",
//     completed: true,
//   },
//   {
//     image: "placeholder",
//     id: 3,
//     name: "Reza",
//     totalScore: 99,
//     playTime: 77,
//     lastPlayed: "May 9 2020",
//     completed: false,
//   },
//   {
//     image: "placeholder",
//     id: 4,
//     name: "David",
//     totalScore: 55,
//     playTime: 4,
//     lastPlayed: "November 1 2020",
//     completed: true,
//   },
// ];

// function Table() {
//   return (
//     <div id="table_div" className={styles.table_div}>
//       <h2 id="table_title">Student Scoreboard</h2>
//       <h4 id="course_name">MEDSCI 120</h4>
//       <table id="table_content" className={styles.table_content}>
//         <thead>
//           <tr>
//             <th className={styles.student_column}>Student</th>
//             <th>Total Score</th>
//             <th>Playtime</th>
//             <th>Last Played</th>
//             <th className={styles.completed_column}>Completed</th>
//           </tr>
//         </thead>
//         <tbody>
//           {students.map((value) => {
//             return (
//               <tr>
//                 <td className={styles.student_column}>
//                   <div className={styles.table_div_small}>
//                     <img
//                       src={userIcon}
//                       alt="user icon"
//                       className={styles.user_icon}
//                     />{" "}
//                     <td>{value.name}</td>
//                   </div>
//                 </td>
//                 <td>{value.totalScore}</td>
//                 <td>{value.playTime}</td>
//                 <td>{value.lastPlayed}</td>
//                 <td className={styles.completed_column}>
//                   {value.completed ? "YES" : "NO"}
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default Table;
