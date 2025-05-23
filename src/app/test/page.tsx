"use client";
import { Icon } from "@/components/Global/Icon";
import { useState } from "react"

type formProps = {
    email: string,
    fullname: string,
    subject: string,
    quote: string,
}
export default function Test () {

    const [formData, setFormData] = useState<formProps>({
        fullname: '',
        email: '',
        subject: '',
        quote: '',

    });

    const handleChanges = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    {
        e.preventDefault();
        setFormData({...formData, [e.target.name]: e.target.value,});
    }
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Form Data is", FormData);
        setFormData({
            fullname: '',
            email: '',
            subject: '',
            quote: '',
        });
    }
    return(
        <section className="flex items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
            <div className="border overflow-hidden border-zinc-700 rounded-2xl bg-zinc-950 shadow-2xl flex flex-col gap-5">
                <div className="head bg-zinc-900/50 w-full flex p-10 items-start justify-start border-b border-b-zinc-700 gap-5">
                   <Icon name="Layout" size={50} className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800 shadow-lg text-yellow-600"/>
                   <div className="">
                        <h2 className="text-xl text-zinc-100 font-bold">
                            Submit your Quaote Request.
                        </h2>
                        <p className="text-zinc-500 py-2">Share us What you are planning to buy from us. anything you want we deliver!</p>
                   </div>
                </div>
                <form method="post" onSubmit={handleSubmit} className="text-zinc-200 grid grid-cols-1 gap-3 p-10">
                    <input
                     type="text"
                     name="fullname"
                     value={formData.fullname}
                     onChange={handleChanges}
                     placeholder="Fullname"
                     className="border border-zinc-700 bg-zinc-800/50 py-2 px-4 rounded-xl w-full outline-0 focus:ring-2 focus:ring-yellow-700"
                    />
                    <input
                     type="email"
                     name="email"
                     value={formData.email}
                     onChange={handleChanges}
                     placeholder="Your Email address"
                     className="border border-zinc-700 bg-zinc-800/50 py-2 px-4 rounded-xl w-full outline-0 focus:ring-2 focus:ring-yellow-700"
                    />

                    <input
                     type="text"
                     name="Subject"
                     value={formData.subject}
                     onChange={handleChanges}
                     placeholder="Reason/ Subject"
                     className="border border-zinc-700 bg-zinc-800/50 py-2 px-4 rounded-xl w-full outline-0 focus:ring-2 focus:ring-yellow-700"
                    />

                    <textarea
                     cols={10}
                     name="quote"
                     value={formData.quote}
                     onChange={handleChanges}
                     placeholder="Explain your quote details here!"
                     className="border border-zinc-700 bg-zinc-800/50 py-2 px-4 rounded-xl w-full outline-0 focus:ring-2 focus:ring-yellow-700"
                    >
                        {/* something */}
                    </textarea>
                </form>
            </div>
        </section>
    )
}