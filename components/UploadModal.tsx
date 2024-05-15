"use client";

import uniqid from "uniqid";
import useUploadModal from "@/hooks/useUploadModal";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import Modal from "./Modal";
import Input from "./Input";
import { useState } from "react";
import Button from "./Button";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

const UploadModal = () => {
    const uploadModal = useUploadModal();
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const supabaseClient = useSupabaseClient();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset
    } = useForm<FieldValues>({
        defaultValues:{
            author: '',
            title: '',
            song: null,
            image: null,
        }
    })
    const onChange = (open: boolean) => {
        if (!open) {
            reset();
            // Reset the form
            uploadModal.onClose();
        }
    }
    const onSubmit: SubmitHandler<FieldValues> = async(values) => {
        // Upload to supabase
        try {
            setIsLoading(true);
            // Extarct the song and image file 
            const imageFile = values.image?.[0];
            const songFile = values.song?.[0];

            if (!imageFile || !songFile || !user) {
                toast.error('Missing fields');
                return;
            }

            // return unique ID that will safely store and name things from supababse bucket
            const uniqueID = uniqid();

            // upload song/image
            const {
                data: songData,
                error: songError,
            } = await supabaseClient
              .storage
              .from('songs')
              .upload(`song-${values.title}-${uniqueID}`, songFile, {
                cacheControl: '3600',
                upsert: false
              });
              if (songError) {
                setIsLoading(false);
                return toast.error('Failed song upload.');
              }

              // Upload image
              const {
                data: imageData,
                error: imageError,
            } = await supabaseClient
              .storage
              .from('images')
              .upload(`image-${values.title}-${uniqueID}`, imageFile, {
                cacheControl: '3600',
                upsert: false
              });
              if (imageError) {
                setIsLoading(false);
                return toast.error('Failed to upload image.');
              }

            // crate record in the db
            const {
                error: supabaseError
            } = await supabaseClient
              .from('songs')
              .insert({
                user_id: user.id,
                author: values.author,
                title: values.title,
                image_path: imageData.path,
                song_path: songData.path
              });
            if (supabaseError) {
                setIsLoading(false);
                return toast.error(supabaseError.message);
            }
            router.refresh();
            setIsLoading(false);
            toast.success('Song created!');
            reset();
            uploadModal.onClose();


        } catch (error) {
            toast.error("Somethin went wrong");
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <Modal
          title="Add a song"
          description="Upload mp3 file"
          isOpen={uploadModal.isOpen}
          onChange={onChange}
        >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-y-4"
            >
                <Input 
                  id="title"
                  disabled={isLoading}
                  {...register('title', { required: true })}
                  placeholder="song title"
                />
                <Input 
                  id="author"
                  disabled={isLoading}
                  {...register('author', { required: true })}
                  placeholder="song author"
                />
                <div>
                    <div>
                        Seleect a song file
                    </div>
                    <Input 
                  id="song"
                  type="file"
                  disabled={isLoading}
                  accept=".mp3"
                  {...register('song', { required: true })}
                />
                </div>
                <div>
                    <div>
                        Seleect an image file
                    </div>
                    <Input 
                  id="image"
                  type="file"
                  disabled={isLoading}
                  accept="image/*"
                  {...register('image', { required: true })}
                />
                </div>
                <Button disabled={isLoading} type="submit">
                    Create
                </Button>
            </form>
        </Modal>
    );
}
export default UploadModal;