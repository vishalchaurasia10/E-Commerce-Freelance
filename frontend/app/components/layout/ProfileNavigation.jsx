'use client'
import { roboto } from '@/app/utils/fonts'
import React, { useContext, useState } from 'react'
import { BsBox } from 'react-icons/bs'
import { FaUser } from 'react-icons/fa'
import { SlLocationPin } from 'react-icons/sl'
import { AiOutlineUser } from 'react-icons/ai'
import authContext from '@/app/context/Auth/authContext'
import Image from 'next/image'

const ProfileNavigation = ({ user }) => {
    const [profileImage, setProfileImage] = useState(null)
    const { uploadProfileImage } = useContext(authContext)
    const handleProfileImageUpload = async () => {
        const fileInput = document.getElementById('profileImage');
        const file = fileInput.files[0];
        uploadProfileImage(user._id, file)
    }

    return (
        <div className={` sticky top-24 h-[42rem] lg:h-[82vh] flex flex-col items-center py-10 px-5 border border-[#4D7E86] ${roboto.className}`}>
            <div className="userDetails w-full relative flex flex-wrap items-center justify-center space-x-4 mb-10">
                <div title='Edit Profile image' className="edit absolute top-0 right-0 text-sm font-bold cursor-pointer">
                    <label className='cursor-pointer' htmlFor="profileImage">
                        Edit
                    </label>
                    <input onChange={handleProfileImageUpload} className='hidden' type="file" name="profileImage" id="profileImage" />
                </div>
                <div className="userImage mb-2">
                    {user?.profileImageId ?
                        <Image className='rounded-full w-40 h-40' src={`http://localhost:8000/uploads/profiles/${user.profileImageId}`} alt="profileImage" height={200} width={200} />
                        :
                        <FaUser className='border-2 border-[#4D7E86] text-[#4D7E86] text-8xl p-2 rounded-full cursor-pointer' />}
                </div>
                <div className="details">
                    <p title={`${user?.firstName} ${user?.lastName}`} className="name font-bold">{user?.firstName} {user?.lastName}</p>
                    <p title={user?.email} className="email text-sm truncate w-40" >{user?.email}</p>
                    <p title={user?.phoneNumber} className="number text-sm">{user?.phoneNumber}</p>
                </div>
            </div>
            <div className="profile flex items-center space-x-4 bg-[#F5F5F5] p-3 rounded-md w-full mb-4 cursor-pointer">
                <AiOutlineUser className='border border-black rounded-full text-xl' />
                <p>My Profile</p>
            </div>
            <div className="orders flex items-center space-x-4 bg-[#F5F5F5] p-3 rounded-md w-full mb-4 cursor-pointer">
                <BsBox className=' text-xl' />
                <p>My Orders</p>
            </div>
            <div className="track flex items-center space-x-4 bg-[#F5F5F5] p-3 rounded-md w-full mb-4 cursor-pointer">
                <SlLocationPin className=' text-xl' />
                <p>Track My Order</p>
            </div>
        </div>
    )
}

export default ProfileNavigation
