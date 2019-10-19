function [ chessboard,Pros ] = visualizeChessboardUpdate( player,attacker,attackPos,chessboard,Pros )
% visualizeChessboardUpdation 此处显示有关此函数的摘要
%   此处显示详细说明
switch Args.visual
    case 'yes'
        [attackPos(1) attackPos(2)]=ind2sub([Args.sizeOfChessboard Args.sizeOfChessboard],attackPos);
        
        chessboard.color(attackPos(1),attackPos(2),1)=player(attacker).color(1);
        chessboard.color(attackPos(1),attackPos(2),2)=player(attacker).color(2);
        chessboard.color(attackPos(1),attackPos(2),3)=player(attacker).color(3);
        
        Pros.figure01=gcf;
        Pros.figure01.Position=[230 250 400 400];
        Pros.axes01=gca;
        Pros.axes01.Position=[0 0 1 1];
        hold on;
        
        imshow(chessboard.color);
        
        pause(Args.pauseTime);
        attackPos=sub2ind([Args.sizeOfChessboard Args.sizeOfChessboard],attackPos(1),attackPos(2));
        
    case 'no'
        disp('do not display visualization .');
    otherwise
        Pros.visual='yes';
        error(disp('error to display visualization'));
end

end

