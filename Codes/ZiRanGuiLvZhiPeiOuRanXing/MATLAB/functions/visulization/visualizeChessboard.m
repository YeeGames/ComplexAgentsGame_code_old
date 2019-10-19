function [ chessboard,Pros ] = visualizeChessboard(chessboard,player,Pros )
% visualizeChessboard 此处显示有关此函数的摘要
%   此处显示详细说明
switch Pros.visual
    case 'yes'
        
        for i=1:Pros.numPlayers
            temp03=zeros(Pros.sizeOfChessboard.*Pros.sizeOfChessboard,1);
            temp04=temp03;
            temp05=temp03;
            temp03=find(chessboard.pos==player(i).id);
            [temp04,temp05]=ind2sub([Pros.sizeOfChessboard,Pros.sizeOfChessboard],temp03);
            for j=1:length(temp03)
                chessboard.color(temp04(j),temp05(j),1)=player(i).color(1);
                chessboard.color(temp04(j),temp05(j),2)=player(i).color(2);
                chessboard.color(temp04(j),temp05(j),3)=player(i).color(3);
            end
        end
        
        Pros.figure01=gcf;
        Pros.figure01.Position=[230 250 400 400];
        Pros.axes01=gca;
        Pros.axes01.Position=[0 0 1 1];
        hold on;
        
        imshow(chessboard.color);
        
        pause(Pros.pauseTime);
        
    case 'no'
        disp('do not display visualization .');
    otherwise
        Pros.visual='yes';
        error(disp('error to display visualization'));
end



end

