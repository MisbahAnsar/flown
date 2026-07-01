export function truncateAddress(address: string, head = 4, tail = 4): string {
  if (address.length <= head + tail + 3) {
    return address;
  }
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}
