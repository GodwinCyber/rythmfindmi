import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * Retrieves an array of songs associated with the current user.
 * 
 * This function uses the Supabase client to authenticate the user and 
 * retrieve their songs from the database. It returns an empty array if 
 * the user is not authenticated or if an error occurs during the retrieval process.
 * 
 * @returns {Promise<Song[]>} A promise that resolves to an array of Song objects.
 */
const getSongsByUserId = async (): Promise<Song[]> => {
    // Create a Supabase client instance with the current request cookies
    const supabase = createServerComponentClient({
        cookies: cookies
    });

    // Get the current user's session data
    const {
        data: sessionData,
        error: sessionError
    } = await supabase.auth.getSession();

    // Handle session errors
    if (sessionError) {
        console.log(sessionError.message);
        return [];
    }

    // Retrieve songs from the database, filtered by the current user's ID
    const { data, error } = await supabase
       .from('songs')
       .select('*')
       .eq('user_id', sessionData.session?.user.id)
       .order('created_at', { ascending: false });

    // Handle database errors
    if (error) {
        console.log(error.message);
    }

    // Return the retrieved songs or an empty array if none were found
    return (data as any) || [];
};

export default getSongsByUserId;