"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { get_key, set_key } from "@/server/datahandler";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function KeyComponent() {
    const [key, setKey] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const key = await get_key();
            if (!key) return;
            setKey(key);
        };
        fetchData();
    }, []);

    return (
        <Card className="w-full mt-5">
            <CardHeader>
                <CardTitle>Script Key</CardTitle>
                <CardDescription>Your mspaint script key for testing purposes. This key is encrypted.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-row gap-2 items-center">
                    <Input placeholder="Enter your script key here..." className="w-full" value={key} onChange={(e) => setKey(e.target.value)} />
                    <Button size={"sm"} onClick={() => {
                        toast.promise(set_key(key), {
                            loading: "Saving...",
                            success: "Saved successfully!",
                            error: "Failed to save key!"
                        });
                    }}>Save</Button>
                </div>
            </CardContent>
        </Card>
    )
}   