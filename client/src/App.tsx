import { Routes, Route } from "react-router-dom";
import SEO from "./components/seo";
import Layout from "./components/layout/layout";
import Home from "./pages/home";
import About from "./pages/about";
import PracticeAreas from "./pages/practice-areas";
import Team from "./pages/team";
import Blog from "./pages/blog";
import Contact from "./pages/contact";
import CaseStudies from "./pages/case-studies";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import LiveChat from "./components/sections/live-chat";

export default function App() {
  return (
    <>
      <SEO title="" />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="practice-areas" element={<PracticeAreas />} />
          <Route path="practice-areas/:slug" element={<PracticeAreas />} />
          <Route path="team" element={<Team />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<Blog />} />
          <Route path="case-studies" element={<CaseStudies />} />
          <Route path="case-studies/:slug" element={<CaseStudies />} />
          <Route path="contact" element={<Contact />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      <LiveChat />
    </>
  );
}
