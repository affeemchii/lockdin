import { redirect } from "react-router";

export const loader = () => {
  return redirect("/app");
};

export default function Index() {
  return null;
}
