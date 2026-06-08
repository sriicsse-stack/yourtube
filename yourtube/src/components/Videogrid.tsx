import React, { useEffect, useState } from "react";
import Videocard from "./videocard";

const Videogrid = () => {
  const [videos, setvideo] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const [error, seterror] = useState<string | null>(null);

  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await fetch("/api/videos");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setvideo(data);
      } catch (error) {
        seterror("Could not load videos");
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 
    lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {loading ? (
        <>Loading...</>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        videos?.map((video: any) => (
          <Videocard key={video._id} video={video} />
        ))
      )}
    </div>
  );
};

export default Videogrid;
