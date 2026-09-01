import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function FavoritesPage() {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get("valinor_session")?.value;

  if (!sessionToken) {
    redirect("/login");
  }

  const session = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    redirect("/login");
  }


  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.userId,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });


  return (
    <main
      dir="rtl"
      style={{
        minHeight:"100vh",
        background:"#faf8f5",
        padding:"70px 40px",
      }}
    >

      <div
        style={{
          maxWidth:"1200px",
          margin:"0 auto",
        }}
      >

        <h1
          style={{
            color:"#C08F8F",
            fontSize:"48px",
            marginBottom:"40px",
          }}
        >
          علاقه‌مندی‌های من ❤️
        </h1>


        {favorites.length === 0 ? (

          <div
            style={{
              background:"#fff",
              borderRadius:"30px",
              padding:"50px",
              textAlign:"center",
              color:"#7a7470",
            }}
          >
            هنوز محصولی به علاقه‌مندی‌ها اضافه نکردی.
          </div>

        ) : (

          <div
            style={{
              display:"grid",
              gridTemplateColumns:"repeat(3,1fr)",
              gap:"30px",
            }}
          >

            {favorites.map((item)=>(
              <Link
                key={item.id}
                href={`/product/${item.product.slug}`}
                style={{
                  textDecoration:"none",
                  color:"inherit",
                }}
              >

                <div
                  style={{
                    background:"#fff",
                    borderRadius:"32px",
                    padding:"22px",
                    boxShadow:"0 12px 35px rgba(0,0,0,.05)",
                  }}
                >

                  <div
                    style={{
                      height:"280px",
                      background:"#f7f4f1",
                      borderRadius:"24px",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      marginBottom:"20px",
                    }}
                  >

                    <img
                      src={item.product.mainImage}
                      alt={item.product.name}
                      style={{
                        width:"80%",
                        height:"80%",
                        objectFit:"contain",
                      }}
                    />

                  </div>


                  <h3
                    style={{
                      fontSize:"22px",
                      marginBottom:"12px",
                    }}
                  >
                    {item.product.name}
                  </h3>


                  <strong>
                    {item.product.price.toLocaleString("fa-IR")} تومان
                  </strong>

                </div>

              </Link>
            ))}

          </div>

        )}

      </div>

    </main>
  );
}