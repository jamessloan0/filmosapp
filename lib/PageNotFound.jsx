import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Film, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-14 h-14 bg-sky-500 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Film className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">404</h1>
        <p className="text-zinc-500 mb-8">This page doesn't exist.</p>
        <Link to={createPageUrl("Dashboard")}>
          <Button className="bg-zinc-900 hover:bg-zinc-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}