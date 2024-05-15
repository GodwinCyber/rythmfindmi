/** Action capable of seacrhing songs based on the title
 * 
 */

import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import getSongs from "./getSongs";

const getSongsByTitle = async (title: string): Promise<Song[]> => {
    /**
     * create component of the supabase client
     */
    const supabase = createServerComponentClient({
        cookies: cookies
    });

    if (title) {
        const allSongs = await getSongs();
        return allSongs;
    }
    /** fetch songs */
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      // fetch song based on like
      .ilike('title', `%${title}%`)
      .order('created_at', { ascending: false });

      if (error) {
        console.log(error);
      }
      return (data as any) || [];
};
export default getSongsByTitle;