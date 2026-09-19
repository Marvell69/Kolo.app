import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import GroupList from "./pages/GroupList";
import GroupDetail from "./pages/GroupDetail";
import ShareView from "./pages/ShareView";

export default function App() {
  return (
    <BrowserRouter>
      <div className="p-4 flex justify-end border-b">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal" />
        </SignedOut>
      </div>
      <Routes>
        <Route
          path="/"
          element={
            <SignedIn>
              <GroupList />
            </SignedIn>
          }
        />
        <Route path="/groups" element={<GroupList />} />
        <Route path="/groups/:groupId" element={<GroupDetail />} />
        <Route path="/share/:token" element={<ShareView />} />
      </Routes>
    </BrowserRouter>
  );
}