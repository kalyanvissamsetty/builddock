"use client"
import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'

function Navbar() {
  return (
    <header className='w-full border-b'>
        <div className='mx-auto flex h-14 max-w-7xl items-center justify-between px-4 '>
            {/* left section */}
            <div className='flex items-center gap-42'>
                <Link href={"/"} className='font-semibold'>Build Dock</Link>

                <nav className='hidden md:flex items-center text-sm gap-4'>
                    <Link href="/" className='text-muted-foreground hover:text-foreground'> Projects</Link>
                    <Link href="/" className='text-muted-foreground hover:text-foreground'> Builds</Link>
                    <Link href="/" className='text-muted-foreground hover:text-foreground'> About</Link>
                </nav>
            </div>
            
            {/* right section */}
            <div className='flex items-center gap-6'>
                <Button variant="ghost">Login</Button>
                <Button>Get Started</Button>
            </div>
        </div>
    </header>
  )
}

export default Navbar