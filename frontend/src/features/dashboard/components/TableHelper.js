function descendingComparator(a, b, orderBy) {
  // Groups
  if (orderBy === "groupNum") {
    if (b.users[0].group < a.users[0].group) return -1;
    if (b.users[0].group > a.users[0].group) return 1;
    return 0;
  }

  if (orderBy === "groupSize") {
    if (b.users.length < a.users.length) return -1;
    if (b.users.length > a.users.length) return 1;
    return 0;
  }
  if (orderBy === "groupStarted") {
    const aStarted = a.path.length > 0;
    const bStarted = b.path.length > 0;
    if (bStarted < aStarted) return -1;
    if (bStarted > aStarted) return 1;
    return 0;
  }

  // Members (except name which is also for state variables)
  if (orderBy === "name") {
    if (b.name < a.name) return -1;
    if (b.name > a.name) return 1;
    return 0;
  }
  if (orderBy === "email") {
    if (b.email < a.email) return -1;
    if (b.email > a.email) return 1;
    return 0;
  }
  if (orderBy === "role") {
    if (b.role < a.role) return -1;
    if (b.role > a.role) return 1;
    return 0;
  }

  // State Variables
  if (orderBy === "type") {
    if (b.type < a.type) return -1;
    if (b.type > a.type) return 1;
    return 0;
  }
  if (orderBy === "value") {
    /**
     * Could be uncommented for number grouping when sorting?
     * Could also add in bool? to group them?
     */
    // const aIsNumber = typeof a.value === "number";
    // const bIsNumber = typeof b.value === "number";
    // if(aIsNumber && !bIsNumber) return -1;
    // if(!aIsNumber && bIsNumber) return 1;
    if (b.value < a.value) return -1;
    if (b.value > a.value) return 1;
    return 0;
  }
  return 0;
}

export default function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
