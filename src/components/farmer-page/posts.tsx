import { Farmer, FarmerPost } from '@/data-model/farmer/FarmerType';
import { cn } from '@/lib/utils';
import { formatDistance } from 'date-fns';
import Image from 'next/image';
import { ItemCarousel } from '../ui/item-carousel';
import { Headline, Label1 } from '../ui/typography';

const Post = ({
  post,
  farmerImage,
}: {
  post: FarmerPost;
  farmerImage: string;
}) => {
  return (
    <div className="px-6 py-5 first:pt-1 last:pb-0 flex gap-2 flex-col">
      <div className="flex items-center gap-2">
        <div className="w-[32px] h-[32px] rounded-full overflow-clip relative">
          <Image
            src={farmerImage}
            alt={'farmer'}
            fill
            quality={10}
            className="rounded-full object-cover"
          />
        </div>
        <Label1 className="text-primary-gray">
          {formatDistance(new Date(post.createdAt), new Date(), {
            addSuffix: true,
          })}
        </Label1>
      </div>
      <Headline>{post.title}</Headline>
      <Label1 className="text-primary-gray">{post.content}</Label1>
      <ItemCarousel
        data={post.images}
        className={cn('overflow-scroll w-full')}
        renderFn={(img, index) => (
          <div
            className={cn(
              'border-light-gray border h-[120px] rounded-3xl overflow-clip relative',
              post.images?.length === 1 ? 'w-[320px]' : 'w-[120px]',
            )}
            key={index}
          >
            <Image
              src={img}
              alt={`bio-${index}`}
              fill
              quality={30}
              className="object-cover"
            />
          </div>
        )}
      />
    </div>
  );
};

export const FarmerPosts = ({
  farmer: { posts, pfp, image },
}: {
  farmer: Farmer;
}) => {
  if (!posts?.length) return null;
  return (
    <div className="divide-y divide-light-gray">
      {posts.map(post => (
        <Post key={post.id} post={post} farmerImage={pfp ?? image} />
      ))}
    </div>
  );
};
